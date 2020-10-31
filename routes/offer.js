const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const isAuthenticated = require("../middleware/isAuthenticated");

const User = require("../models/User");
const Offer = require("../models/Offer");

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_API_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

//ROUTE PUBLISH POUR POSTER DES ANNONCES ---------------CREATE--------------------------------------------------------------------
router.post("/offer/publish", isAuthenticated, async (req, res) => {
    try {

        const newOffer = await new Offer ({
        product_name: req.fields.title,
        product_description: req.fields.description,
        product_price: req.fields.price,
        product_details:   [{"MARQUE" : req.fields.brand},
                            {"TAILLE" : req.fields.size},
                            {"ETAT" : req.fields.condition},
                            {"COULEUR" : req.fields.color},
                            {"EMPLACEMENT" : req.fields.city}],
        owner: req.user,
        });
            console.log(req.files.picture);

    if (req.files.picture !== undefined) {

        try {
            const pictureToUpoload = req.files.picture.path;
            const result = await cloudinary.uploader.upload(pictureToUpoload, {
                folder :`/vinted/offers/${newOffer._id}`,
            });
            newOffer.product_image = result;


        } catch (err) {
            console.log(err.message);
            res.status(400).json(err.message)
        }

    }
        await newOffer.save();
        res.status(200).json(newOffer);
    } catch (err) {
        res.status(400).json(err.message);
    }
});

//ROUTE OFFERS POUR AFFICHER LES ANNONCES --------------READ----------------------------------------------------------------------
router.get("/offers", async (req, res) => {
    try {
        let filters = {};

    if (req.query.sort === "price-asc") {
        sort = "asc";
    } else {
        sort = "desc";
    }

    if (req.query.title) {
        filters.product_name = new RegExp (req.query.title, "i");
    }

    if (req.query.priceMin) {
        filters.product_price = { $gte: req.query.priceMin };
    }

    if (req.query.priceMax) {
        if (filters.product_price) {
            filters.product_price.$lte = req.query.priceMax;
        } else {
            filters.product_price = { $lte: req.query.priceMax };
        }
    }

        let page;
    if (req.query.page) {
        page = Number(req.query.page);
    } else {
        page = 1;
    }

    const offers = await Offer
        .find(filters)
        .sort({ product_price: sort })
        .select("product_name product_description product_price")
        .skip(10 * Number(page) - 10)
        .limit(10);

    const count = await Offer.countDocuments(filters);

        return res.status(200).json({ count: count,
            offers: offers });

    } catch (err) {
        return res.status(400).json({ message : err.message});
    }
});

//ROUTE UPDATE POUR MODIFIER DES ANNONCES --------------UPDATE--------------------------------------------------------------------
router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
    try {

        console.log(req.params.id)
        offerToUpdate = await Offer.findById(req.params.id);

            if (req.fields.title)
                offerToUpdate.product_name = req.fields.title;

            if (req.fields.description)
                offerToUpdate.product_description = req.fields.description;

            if (req.fields.price)
                offerToUpdate.product_price = req.fields.price;

        for (i=0; i < offerToUpdate.product_details.length; i++) {
            if (req.fields.brand)
                offerToUpdate.product_details[0].MARQUE = req.fields.brand;

            if(req.fields.size)
                offerToUpdate.product_details[1].TAILLE = req.fields.size;

            if (req.fields.condition)
                offerToUpdate.product_details[2].ETAT = req.fields.condition;

            if(req.fields.color)
                offerToUpdate.product_details[3].COULEUR = req.fields.color;

            if (req.fields.city)
                offerToUpdate.product_details[4].EMPLACEMENT = req.fields.city;
            }

        if (req.fields.price)
            offerToUpdate.product_price = req.fields.price;

        offerToUpdate.markModified("product_details");

            if (req.files.picture) {
                try {
                    const pictureToUpoload = req.files.picture.path;
                    const result = await cloudinary.uploader.upload(pictureToUpoload, {
                    folder :`/vinted/offers/${offerToUpdate._id}`,
                });

                offerToUpdate.product_image = result;

                } catch (err) {
                    res.status(400).json({ message: `An error occured : ${err.message}`});
                }
            }

            await offerToUpdate.save();
            return res.status(200).json({ message: "Offer updated succefully"});

    } catch(err) {
        console.log(err)
        res.status(400).json({ message: `An error occured : ${err.message}`});
    }
    })

//ROUTE DELETE POUR SUPPRIMER DES ANNONCES -------------DELETE--------------------------------------------------------------------
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
    try {
        offerToDelete = await Offer.findById(req.params.id);

        await cloudinary.api.delete_resources_by_prefix(`vinted/offers/${req.params.id}`);
        console.log("1")
        await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);
        console.log("2")
        await offerToDelete.delete();
        console.log("3")
        res.status(200).json({ message:" Offer deleted succesfully" });

    } catch (err) {
        res.status(400).json(err.message);
    }
})

module.exports = router;


