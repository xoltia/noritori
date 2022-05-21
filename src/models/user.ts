import {Schema, model} from 'mongoose';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface IUser {
  name: string;
  password: string;
  comparePassword(
    candidatePassword: string,
    cb: (err: Error | undefined, isMatch: boolean) => void
  ): void;
  getToken(): string;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

UserSchema.method(
  'comparePassword',
  function (
    candidatePassword: string,
    cb: (err: Error | undefined, isMatch: boolean) => void
  ) {
    bcrypt.compare(candidatePassword, this.password, cb);
  }
);

UserSchema.method('getToken', function () {
  return jwt.sign({sub: this.id}, config.secret);
});

export default model<IUser>('User', UserSchema);

export const UserValidationSchema = Joi.object().keys({
  name: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(8).max(50).required(),
});
