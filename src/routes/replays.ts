import Axios from 'axios';
import Koa from 'koa';
import Router from 'koa-router';
import { renderReplayTemplate } from '../templates';

const getReplay = async (id: string, password?: string) => {
  try {
    const {data} = await Axios.post('https://clover.weedl.es/~~clodown/api/getreplay', {
      id,
      password,
    }, { responseType: 'text' });
  
    if (data.startsWith(']')) {
      return JSON.parse(data.substring(1)).replay;
    }
  } catch {}

  return undefined;
};

interface SearchParameters {
  page?: number;
  rating?: boolean;
  format?: string;
  username?: string;
  username2?: string;
  order?: string;
}

const searchReplays = async (parameters: SearchParameters) => {
  try {
    console.log(parameters);
    const {data} = await Axios.post(
      'https://clover.weedl.es/~~clodown/api/searchreplays',
      parameters,
      { responseType: 'text' },
    );

    console.log(data);
  
    if (data.startsWith(']')) {
      return JSON.parse(data.substring(1)).replays;
    }
  } catch(e) {
    console.log(e);
  }

  return [];
};

const parseReplayId = (id: string) => {
  let currentId = id;

  if (id.endsWith('pw')) {
    currentId = currentId.substring(0, currentId.length - 2); // Strip 'pw'
    const lastDashIndex = id.lastIndexOf('-'); // Find last dash
    const password = id.substring(lastDashIndex + 1); // Extract password
    currentId = currentId.substring(0, lastDashIndex); // Extract id portion
    return [currentId, password];
  }

  return [currentId];
};

const fromArray = <T>(value: T | T[]): T => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const searchParametersFromQuery = (ctx: Koa.ParameterizedContext): SearchParameters => {
  const searchParameters: SearchParameters = {};

  if (ctx.query.page) {
    searchParameters.page = parseInt(fromArray(ctx.query.page) || '0') || 0;
  }

  if (ctx.query.rating) {
    searchParameters.rating = fromArray(ctx.query.rating) !== undefined;
  }

  if (ctx.query.format) {
    searchParameters.format = fromArray(ctx.query.format);
  }

  if (ctx.query.username) {
    searchParameters.username = fromArray(ctx.query.username);
  }

  if (ctx.query.username2) {
    searchParameters.username2 = fromArray(ctx.query.username2);
  }

  if (ctx.query.order) {
    searchParameters.order = fromArray(ctx.query.order);
  }

  console.log(searchParameters);

  return searchParameters;
};

const createReplaysRouter = () => {
  const router = new Router();

  router.get('/search.json', async (ctx) => {
    const params = searchParametersFromQuery(ctx);
    const replays = await searchReplays(params);

    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = JSON.stringify(replays);
  });

  router.get('/:replayId.json', async (ctx) => {
    if (!ctx.params.replayId) {
      ctx.status = 400;
      ctx.body = 'No replay id specified.';
      return;
    }

    const [id, password] = parseReplayId(ctx.params.replayId);
    const replay = await getReplay(id, password);

    if (!replay) {
      ctx.status = 404;
      ctx.body = 'No replay found.';
      return;
    }

    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = JSON.stringify(replay);
  });

  router.get('/:replayId.log', async (ctx) => {
    if (!ctx.params.replayId) {
      ctx.status = 400;
      ctx.body = 'No replay id specified.';
      return;
    }

    const [id, password] = parseReplayId(ctx.params.replayId);
    const replay = await getReplay(id, password);

    if (!replay) {
      ctx.status = 404;
      ctx.body = 'No replay found.';
      return;
    }

    ctx.status = 200;
    ctx.body = replay.log;
  });

  router.get('/:replayId', async (ctx) => {
    if (!ctx.params.replayId) {
      ctx.status = 400;
      ctx.body = 'No replay id specified.';
      return;
    }

    const [id, password] = parseReplayId(ctx.params.replayId);
    const replay = await getReplay(id, password);

    if (!replay) {
      ctx.status = 404;
      ctx.body = 'No replay found.';
      return;
    }

    ctx.type = 'html';
    ctx.body = renderReplayTemplate({
      rootUrl: 'https://clover.weedl.es',
      id: replay.id,
      format: replay.format,
      p1Id: replay.p1id,
      p1Name: replay.p1,
      p2Id: replay.p2id,
      p2Name: replay.p2,
      battleLog: replay.log,
    });
  });

  return router;
};

export default createReplaysRouter;
