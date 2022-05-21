import User, {UserValidationSchema} from '../models/user';
import {Request, Response} from 'express';
import {Controller, Post} from './decorators';

@Controller('/auth')
export default class AuthController {
  @Post('/register')
  async register(req: Request, res: Response) {
    const {
      value: {name, password},
      error,
    } = UserValidationSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    const user = await User.findOne({name});
    if (user) {
      res.status(403).json({
        error: 'User already exists',
      });
      return;
    }
    const newUser = new User({
      name,
      password,
    });

    await newUser.save();

    res.status(201).json({
      token: newUser.getToken(),
    });
  }
}
