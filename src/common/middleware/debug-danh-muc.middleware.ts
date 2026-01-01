import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DebugDanhMucMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('================ DEBUG DANH-MUC ================');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('================================================');

    next();
  }
}
