import User, {UserValidationSchema} from '../models/user';
import {Request, Response} from 'express';
import {Controller, Get, Post} from './decorators';
import {ValidateBody} from '../middleware/validation';

@Controller('/auth')
export default class AuthController {
  @Post('/login')
  @ValidateBody(UserValidationSchema)
  async login(req: Request, res: Response) {
    const {name, password} = req.body;
    const user = await User.findOne({name});
    const isMatch = user && (await user.comparePassword(password));
    if (isMatch) {
      const token = user.getToken();
      res.cookie('jwt', token, {httpOnly: true});
      res.json({token});
      return;
    }
    res.status(401).json({
      error: 'Invalid name or password',
    });
  }

  @Post('/register')
  @ValidateBody(UserValidationSchema)
  async register(req: Request, res: Response) {
    const {name, password} = req.body;
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

    const token = newUser.getToken();
    res.cookie('jwt', token, {httpOnly: true});
    res.status(201).json({token});
  }
}
