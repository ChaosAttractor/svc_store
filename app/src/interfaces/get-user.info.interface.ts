interface UserRights {
  allMethods?: string[];
}

export default interface IGetUserInfo {
  userId?: string;
  fullName?: string;
  keycloakId?: string;
  firstName?: string;
  lastName?: string;
  email?: string,
  userRights?: UserRights,
  allRights?: UserRights,
};
