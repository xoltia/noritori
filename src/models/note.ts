import {Schema, model, FilterQuery} from 'mongoose';
import {IUser} from './user';
import Joi from 'joi';

// Conversion functions for getting values in milliseconds
const hours = (hours: number) => hours * 60 * 60 * 1000;
const days = (days: number) => hours(days * 24);
const weeks = (weeks: number) => days(weeks * 7);
const months = (months: number) => weeks(months * 4);

/**
 * Rounds a date up to the nearest hour.
 * Ex: Date(2020, 1, 1, 12, 20, 0) -> Date(2020, 1, 1, 13, 0, 0)
 * @param date Date to round
 * @returns The same date object rounded
 */
function ceilHour(date: Date): Date {
  date.setHours(date.getHours() + Math.ceil(date.getMinutes() / 60));
  date.setMinutes(0, 0, 0);
  return date;
}

export const LEVEL_TIMINGS = [
  hours(4),
  hours(8),
  days(1),
  days(2),
  weeks(1),
  weeks(2),
  months(1),
  months(4),
];

export const MAX_LEVEL = LEVEL_TIMINGS.length;

export enum NoteType {
  Word = 'word',
  Kanji = 'kanji',
}

export interface INote {
  _id: Schema.Types.ObjectId;
  creator: Schema.Types.ObjectId | IUser;
  text: string;
  meanings: string[];
  readings: string[];
  description?: string;
  exampleSentences: string[];
  notes?: string;
  tags: string[];
  type: NoteType;
  level: number;
  dueAt?: Date;
  burnedAt?: Date;
  createdAt: Date;

  get isReviewable(): boolean;
  get isBurned(): boolean;

  computeDueDate(): Date;
  levelUp(): void;
  levelDown(timesIncorrect: number): void;
}

export interface NoteQuery {
  level?: number;
  levelGt?: number;
  levelLt?: number;
  type?: NoteType;
  burned?: boolean;
  due: boolean;
  dueAt?: Date;
}

export const NoteQuerySchema = Joi.object({
  level: Joi.number().integer().min(0),
  levelGt: Joi.number().integer().min(0),
  levelLt: Joi.number().integer().min(0),
  type: Joi.string().valid(NoteType.Word, NoteType.Kanji),
  burned: Joi.boolean(),
  due: Joi.boolean(),
  dueAt: Joi.date(),
});

export const NoteInsertSchema = Joi.object({
  text: Joi.string().required(),
  meanings: Joi.array().items(Joi.string()).min(1).max(30).required(),
  readings: Joi.array().items(Joi.string()).min(1).max(30).required(),
  description: Joi.string(),
  exampleSentences: Joi.array().items(Joi.string()),
  notes: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  type: Joi.string().valid(NoteType.Word, NoteType.Kanji),
});

const NoteSchema = new Schema<INote>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    meanings: {
      type: [String],
      required: true,
    },
    readings: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
    },
    exampleSentences: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: [NoteType.Word, NoteType.Kanji],
      default: NoteType.Word,
    },
    dueAt: {
      type: Date,
      default: () => {
        const now = new Date();
        const dueAt = new Date(now.getTime() + LEVEL_TIMINGS[0]);
        return ceilHour(dueAt);
      },
    },
    level: {
      type: Number,
      default: 0,
    },
    burnedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NoteSchema.virtual('isBurned').get(function () {
  return this.level >= LEVEL_TIMINGS.length;
});

NoteSchema.virtual('isReviewable').get(function () {
  return !this.isBurned && this.dueAt && this.dueAt < new Date();
});

NoteSchema.method('computeDueDate', function (): Date {
  if (this.isBurned) {
    // This should not happen
    throw new Error('Note is burned');
  }
  const now = new Date();
  const dueAt = new Date(now.getTime() + LEVEL_TIMINGS[this.level]);
  return ceilHour(dueAt);
});

NoteSchema.method('levelUp', function () {
  if (!this.isReviewable) {
    throw new Error('Note is not reviewable');
  }

  this.level++;

  if (this.isBurned) {
    this.burnedAt = new Date();
    this.dueAt = null;
  } else {
    this.dueAt = this.computeDueDate();
  }
});

NoteSchema.method('levelDown', function (numTimesIncorrect: number) {
  if (!this.isReviewable) {
    throw new Error('Note is not reviewable');
  }

  if (this.level !== 0) {
    const penaltyFactor = this.level >= 4 ? 2 : 1;
    this.level = Math.max(
      0,
      Math.ceil(this.level - numTimesIncorrect * penaltyFactor)
    );
  }
  this.dueAt = this.computeDueDate();
});

export function getQueryFilter(query: NoteQuery): FilterQuery<INote> {
  const {level, levelGt, levelLt, type, burned, due, dueAt} = query;
  const conditions: FilterQuery<INote> = {};

  if (level) conditions.level = level;

  if (levelGt && levelLt) conditions.level = {$gte: levelGt, $lte: levelLt};
  else if (levelGt) conditions.level = {$gte: levelGt};
  else if (levelLt) conditions.level = {$lte: levelLt};

  if (type) conditions.type = type;
  if (burned) conditions.burnedAt = {$exists: true};
  if (due) conditions.dueAt = {$lte: new Date()};
  if (dueAt) conditions.dueAt = {$lte: dueAt};

  return conditions;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// the static is registered in the model
export default model<INote>('Note', NoteSchema);
