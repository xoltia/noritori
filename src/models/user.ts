import {Schema, model} from 'mongoose';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface IUser {
  _id: Schema.Types.ObjectId;
  name: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
  function (candidatePassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return reject(err);
        resolve(isMatch);
      });
    });
  }
);

UserSchema.method('getToken', function () {
  return jwt.sign({sub: this.id}, config.secret);
});

export const UserValidationSchema = Joi.object().keys({
  name: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(8).max(50).required(),
});

export default model<IUser>('User', UserSchema);
