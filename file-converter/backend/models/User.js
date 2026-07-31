import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export const ConversionHistory = sequelize.define('ConversionHistory', {
  OriginalFilename: { type: DataTypes.STRING, allowNull: false },
  ConvertedFilename: { type: DataTypes.STRING, allowNull: false },
  SourceFormat: { type: DataTypes.STRING, allowNull: false },
  TargetFormat: { type: DataTypes.STRING, allowNull: false },
  FileSize: { type: DataTypes.STRING, allowNull: false },
  ConversionStatus: { type: DataTypes.STRING, allowNull: false },
  expirationTime: { type: DataTypes.DATE, allowNull: true }
});

User.hasMany(ConversionHistory, { foreignKey: 'UserId' });
ConversionHistory.belongsTo(User, { foreignKey: 'UserId' });