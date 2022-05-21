import passport from 'passport';
import {Strategy as BearerStrategy} from 'passport-http-bearer';

passport.use(
  new BearerStrategy((token, done) => {
    return done(null, {});
  })
);
