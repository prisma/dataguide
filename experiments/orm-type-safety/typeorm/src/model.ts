import { localConnection } from './helper.js'
import 'reflect-metadata'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  DataSource,
  type Relation,
} from 'typeorm'
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id!: number
  @Column({ type: 'text', unique: true }) email!: string
  @Column({ type: 'text', nullable: true }) name!: string | null
  @OneToMany(() => Post, (post) => post.author) posts!: Relation<Post>[]
}
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn() id!: number
  @Column({ type: 'text' }) title!: string
  @Column({ type: 'boolean', default: false }) published!: boolean
  @ManyToOne(() => User, (user) => user.posts, { nullable: false }) author!: Relation<User>
}
@Entity()
export class Mismatched {
  @PrimaryGeneratedColumn() id!: number
  @Column({ type: 'text', nullable: true }) name!: string
}
export const source = new DataSource({
  type: 'postgres',
  url: localConnection('EXPERIMENT_DATABASE_URL'),
  entities: [User, Post],
  synchronize: false,
})
export const users = source.getRepository(User)
export const posts = source.getRepository(Post)
