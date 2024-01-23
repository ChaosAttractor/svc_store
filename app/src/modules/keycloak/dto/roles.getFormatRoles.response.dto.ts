// eslint-disable-next-line max-classes-per-file
class UpdatesInfo {
  createdAt: Date;

  updatedAt: Date;

  changer: string;
}

export default class RolesGetFormatRolesResponseDto {
  roleId: string;

  name: string;

  roleType: string;

  immutable: boolean;

  methods?: string[];

  updatesInfo?: UpdatesInfo;

  allowIps?: {
    id?: number;
    ip: string;
  }[];
}
