/**
 * dto поиска пользователя
 */
export default class UsersFindDto {
  /**
   * Логин пользователя
   */
  username?: string;

  /**
   * email пользователя
   */
  email?: string;

  /**
   * Активен ли пользователь
   */
  enabled?: boolean;

  /**
   * Искать по точному совпадению (= вместо ILIKE)
   */
  exact?: boolean;
}
