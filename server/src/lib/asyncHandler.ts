import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

/**
 * Express 4는 async 핸들러가 던진(reject된) 에러를 자동으로 잡아주지 않는다 —
 * try/catch 없이 await 하다 실패하면(예: Redis 순간 장애) 요청이 응답 없이
 * 그대로 멈춘다. 이 래퍼로 감싸면 실패가 전역 에러 핸들러(app.ts)로 넘어가서
 * 최소한 일관된 JSON 에러 응답을 받는다.
 *
 * 제네릭을 RequestHandler와 동일하게 유지해야 "/:code" 같은 라우트 경로에서
 * Express가 추론하는 req.params 타입(예: { code: string })이 그대로 살아남는다 —
 * 그냥 Request로 고정하면 라우트별 params 타입이 ParamsDictionary로 뭉개진다.
 */
export function asyncHandler<
  P = ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqBody = any,
  ReqQuery = Query,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
