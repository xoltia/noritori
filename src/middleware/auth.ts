import passport from 'passport';
import {Strategy as BearerStrategy} from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import config from '../config';
import User, {IUser} from '../models/user';
import {createMiddlewareAppender} from './decorator';

passport.use(
  new BearerStrategy((token, done) => {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) return done(err);
      const id = decoded?.sub;
      if (!id) return done(null, false);
      User.findById(id, (err: Error, user: IUser) => {
        if (err) return done(err);
        if (!user) return done(null, false);
        return done(null, user);
      });
    });
  })
);

export const Authenticate = createMiddlewareAppender(
  passport.authenticate('bearer', {session: false})
);
