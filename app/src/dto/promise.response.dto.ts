import ResponseDto from './response.dto';

type PromiseApiResponse<T = undefined> = Promise<ResponseDto<T>>;
export default PromiseApiResponse;
