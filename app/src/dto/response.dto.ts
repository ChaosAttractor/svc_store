export default class ResponseDto<T =undefined> {
  message: string;

  data?: T;
}
