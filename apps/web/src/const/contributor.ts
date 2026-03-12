import type { ContributorInfo } from '@/components/features/settings/items/about/contributor';
import { service } from '@/services';

const avatarURL = service.assetService.url.avatar;

export const contributors: ContributorInfo[] = [
  {
    name: 'bietiaop',
    avatar: 'https://i2.hdslb.com/bfs/face/32dcf0a7744d4e39da30d5c81db0d4c79610b9cd.jpg',
    home: 'https://space.bilibili.com/152308001',
    noReferrer: true,
  },
  {
    name: 'qwerdvd',
    avatar: `${avatarURL}/qwerdvd.jpg`,
    home: 'https://space.bilibili.com/44495289',
  },
  {
    name: 'skadiD',
    avatar: 'https://i2.hdslb.com/bfs/face/b8c2c0c2658355a50000bf97e4c7849f16d13f1f.webp',
    home: 'https://space.bilibili.com/9934999',
    noReferrer: true,
  },
  {
    name: '冬雪巫女',
    avatar: 'https://i2.hdslb.com/bfs/face/f43fbafee00a8ef5ac6cdbb6dec799e53393438e.jpg',
    home: 'https://space.bilibili.com/45248782',
    noReferrer: true,
  },
  {
    name: 'DisLido',
    avatar: 'https://oss.dislido.cn/static/DisLido_avatar.jpg',
    home: 'https://space.bilibili.com/781911',
    noReferrer: true,
  },
  {
    name: '白纸camy-白云笺',
    avatar: 'https://i0.hdslb.com/bfs/face/2a460f40d575e480393b50191b1bbdfd62a3afe6.jpg',
    home: 'https://space.bilibili.com/286451682',
    noReferrer: true,
  },
  {
    name: '佑木いずみ',
    avatar: 'https://i0.hdslb.com/bfs/face/e54beaed3b037b0b5cc9b3d33cd4950a0d0887cd.jpg',
    home: 'https://space.bilibili.com/184934952',
    noReferrer: true,
  },
  {
    name: 'Wuyi无疑',
    avatar: 'https://avatars.githubusercontent.com/u/55526518?v=4',
    home: 'https://github.com/KimigaiiWuyi',
    noReferrer: true,
  },
  {
    name: 'Student233',
    avatar: 'https://avatars.githubusercontent.com/u/60351161?v=4',
    home: 'https://github.com/HaloStudent233',
    noReferrer: true,
  },
];
