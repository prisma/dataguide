import { localConnection } from './helper.js'
import {
  Sequelize,
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize'
export const sequelize = new Sequelize(localConnection('EXPERIMENT_DATABASE_URL'), {
  logging: false,
})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>
  declare email: string
  declare name: string | null
  declare posts?: NonAttribute<Post[]>
}
export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>
  declare title: string
  declare published: CreationOptional<boolean>
  declare authorId: number
}
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'users', timestamps: false }
)
Post.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false, field: 'author_id' },
  },
  { sequelize, tableName: 'posts', timestamps: false }
)
User.hasMany(Post, { as: 'posts', foreignKey: 'authorId' })
Post.belongsTo(User, { as: 'author', foreignKey: 'authorId' })
export class Mismatched extends Model<
  InferAttributes<Mismatched>,
  InferCreationAttributes<Mismatched>
> {
  declare id: CreationOptional<number>
  declare name: string
}
Mismatched.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'mismatched', timestamps: false }
)
