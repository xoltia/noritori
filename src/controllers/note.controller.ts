import Note, {
  NoteQuerySchema,
  NoteInsertSchema,
  NoteQuery,
  getQueryFilter,
} from '../models/note';
import {Controller, Get, Post, Patch} from './decorators';
import {Request, Response} from 'express';
import {Authenticate} from '../middleware/auth';
import {IUser} from '../models/user';
import {ValidateQuery, ValidateBody, Validate} from '../middleware/validation';
import Joi from 'joi';

@Controller('/notes')
export default class NoteController {
  @Get('/')
  @ValidateQuery(NoteQuerySchema)
  @Authenticate
  async getUserNotes(req: Request, res: Response) {
    const user = req.user as IUser;
    const filter = getQueryFilter((<Object>req.query) as NoteQuery);
    const notes = await Note.find({creator: user._id, ...filter});
    res.send(notes);
  }

  @Get('/:id')
  async getNote(req: Request, res: Response) {
    const note = await Note.findById(req.params.id);
    if (!note)
      return res.status(404).send({
        message: 'Note not found',
      });
    res.send(note);
  }

  @Post('/')
  @ValidateBody(NoteInsertSchema)
  @Authenticate
  async createNote(req: Request, res: Response) {
    const note = new Note({...req.body, creator: (<IUser>req.user)._id});
    await note.save();
    res.status(201).send(note);
  }

  @Patch('/:id/progress/:amount')
  @Validate(
    Joi.number().integer().not(0).max(1).note('incrementAmount'),
    req => req.params.amount,
    {convert: true}
  )
  @Authenticate
  async updateProgress(req: Request, res: Response) {
    const note = await Note.findById(req.params.id);
    if (!note)
      return res.status(404).send({
        message: 'Note not found',
      });
    if (note.creator.toString() !== (<IUser>req.user)._id.toString())
      return res.status(403).send({
        message: 'You are not the creator of this note',
      });
    if (!note.reviewable)
      return res.status(400).send({
        message: 'Note is not reviewable',
      });

    const amount = parseInt(req.params.amount, 10);
    if (amount === 1) {
      note.levelUp();
    } else {
      note.levelDown(amount);
    }

    await note.save();

    res.status(200).send({
      dueAt: note.dueAt,
      dueIn: note.dueAt ? note.dueAt.getTime() - Date.now() : null,
      burned: note.isBurned,
    });
  }
}
