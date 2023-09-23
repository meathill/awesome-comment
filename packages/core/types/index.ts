import { CommentStatus } from '../data';

export type AcConfig = {
  adminEmails: string[];
}

export type ResponseBody<T> = {
  code: number;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    config?: AcConfig;
  };
}

type BaseComment = {
  id: number;
  postId: string;
  content: string;
  userId: string;
  parentId?: number;
  ancestorId?: number;
  status: CommentStatus;
  children?: Comment[];
}
export type Comment = BaseComment & {
  createdAt: Date;
  user?: {
    email: string;
    name: string;
    avatar: string;
  };
  isNew?: boolean;
  isAdmin?: boolean;
}
export type ResponseComment = BaseComment & {
  created_at: string;
  user?: string;
  parent_id?: number;
  ancestor_id?: number;
}

export type User = {
  id: string;
  name: string;
  nickname: string;
  picture: string;
  email: string;
  sub: string;
}
