import { INestApplication, Injectable, OnModuleDestroy } from '@nestjs/common';
import { join } from 'node:path';

interface PrismaClientOptions {
  datasources?: {
    db?: {
      url?: string;
    };
  };
}

interface UserEntity {
  id: string;
  walletAddress: string;
  nonce: string;
  email: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface UserUpsertArgs {
  where: {
    walletAddress: string;
  };
  update: {
    nonce: string;
  };
  create: {
    walletAddress: string;
    nonce: string;
  };
}

interface UserFindUniqueArgs {
  where: {
    walletAddress: string;
  };
}

interface UserUpdateArgs {
  where: {
    walletAddress: string;
  };
  data: {
    nonce?: string;
    lastLoginAt?: Date;
  };
}

interface PrismaClientInstance {
  user: {
    upsert(args: UserUpsertArgs): Promise<UserEntity>;
    findUnique(args: UserFindUniqueArgs): Promise<UserEntity | null>;
    update(args: UserUpdateArgs): Promise<UserEntity>;
  };
  $on(event: 'beforeExit', listener: () => Promise<void> | void): void;
  $disconnect(): Promise<void>;
}

type PrismaClientConstructor = new (options?: PrismaClientOptions) => PrismaClientInstance;

const { PrismaClient: PrismaClientBase } = require(
  join(__dirname, '../../../generated/prisma/client'),
) as {
  PrismaClient: PrismaClientConstructor;
};

@Injectable()
export class PrismaService
  extends PrismaClientBase
  implements PrismaClientInstance, OnModuleDestroy
{
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
