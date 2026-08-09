import mongoose from 'mongoose';

export const TECHNOLOGY_TYPES = [
  'language',
  'framework',
  'runtime',
  'database',
  'library',
  'platform',
  'tool'
];

const technologySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: TECHNOLOGY_TYPES, required: true, index: true },
    description: { type: String, default: '', trim: true },
    parentTechnology: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology', default: null },
    iconKey: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

technologySchema.index({ status: 1, type: 1, order: 1, name: 1 });
technologySchema.index({ parentTechnology: 1, status: 1 });
technologySchema.index({ name: 'text', description: 'text', slug: 'text' });

export const Technology = mongoose.model('Technology', technologySchema);
