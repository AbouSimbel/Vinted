const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");


// ROUTE SIGN UP
router.post("/user/signup", async (req, res) => {
    try {
        const { email, username, phone, password } = req.fields;
        const user = await User.findOne({ email });

        if (user)
            return res.status(409).json({ message : "Cet email est dejà utilisé"});

        if (!(/^[a-zA-Z0-9]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/.test(email)))
            return res.status(400).json({ message : "Vous avec entré un email invalide" });

        if (!username)
            return res.status(400).json({ message: "Vous n'avez pas saisi de username"});

        if (!password || password.length <= 4)
            return res.status(400).json({ message : "Vous avec entré un mdp invalide" });

        if (phone) {
            if (phone.length !== 10 || !(/0+[6-7]+[0-9]{8}/).test(phone)) {
                return res.status(400).json({ message : "Vous avec entré un numéro invalide" });
            };
        };

        const salt = uid2(64);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(64);

        const newUser = await new User({
            email,
            account: {
                username,
                phone,
            },
            token,
            hash,
            salt
        }).save();

        return res.status(200).json({
            "_id": newUser.id,
            "token": newUser.token,
            "account": {
            "username": newUser.account.username,
            "phone": newUser.account.phone,
            },
        });

    } catch (err) {
        console.error(err.message);
        res.status(400).json(`An error occurred ${err}`);
    }
});

// ROUTE LOGIN
router.post("/user/login", async (req, res) => {
    try {

        const {email, password} = req.fields;
        const user = await User.findOne({email,});

        if (!(user && SHA256(password + user.salt).toString(encBase64) === user.hash))
            return res.status(400).json("Utilisateur ou mot de passe erroné");

        res.status(200).json({
            id: user._id,
            token: user.token,
            account: user.account
        });

    } catch (err) {
        res.status(400).json(`An error occured ${err}`)
    }
});

module.exports = router;
