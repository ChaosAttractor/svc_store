/**
 * dto создания роли
 */
export default class RoleCreateDto {
  /**
   * Название роли
   */
  name: string;

  /**
   * Аттрибуты роли
   */
  attributes: Record<string, [string]>;

  realmRoles?: string[];
}

