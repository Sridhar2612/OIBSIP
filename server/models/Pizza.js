const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Pizza description is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Pizza image URL is required']
    },
    category: {
      type: String,
      required: true,
      enum: ['Veg', 'Non-Veg', 'Specialty', 'Gourmet'],
      default: 'Veg'
    },
    price: {
      type: Number,
      required: [true, 'Pizza base price is required'],
      min: [0, 'Price cannot be negative']
    },
    ingredients: [
      {
        type: String,
        trim: true
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Pizza', pizzaSchema);
