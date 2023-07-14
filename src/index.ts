import Koa from 'koa';
import KoaBody from 'koa-body';
import Router from 'koa-router';
import { createReplaysRouter, createUsersRouter } from './routes';

const createApp = () => {
  const app = new Koa();
  app.use(KoaBody());

  const router = new Router();
  const replaysRouter = createReplaysRouter();
  const usersRouter = createUsersRouter();
  router.use('/replays', replaysRouter.routes(), replaysRouter.allowedMethods());
  router.use('/users', usersRouter.routes(), usersRouter.allowedMethods());

  app.use(router.routes());
  return app;
};

const app = createApp();
app.listen(9090);
