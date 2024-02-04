export type SetString = Set<string>;
export type RoleArray = Array<{id, methodSet: SetString}>;
export default interface UsersGetMethodsInterface {
  allMethods: SetString,
  roles: RoleArray,
}
