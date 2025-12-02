const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GoogleUser=require("../model/googleUser.js");

module.exports = function (passport) {

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists
                    let existingUser = await GoogleUser.findOne({ googleId: profile.id });

                    if (existingUser) {
                        return done(null, existingUser);
                    }

                    // Create new user
                    const newUser = new GoogleUser({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        photo: profile.photos[0].value
                    });

                    await newUser.save();
                    return done(null, newUser);
                } catch (err) {
                    console.error(err);
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        const user = await GoogleUser.findById(id);
        done(null, user);
    });
};



