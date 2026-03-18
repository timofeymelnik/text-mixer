export type RemoteServiceErrorType = 'network' | 'timeout' | 'invalid_response';

export class RemoteServiceError extends Error {
  readonly type: RemoteServiceErrorType;

  constructor(type: RemoteServiceErrorType, message: string) {
    super(message);
    this.type = type;
  }
}
