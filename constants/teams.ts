import { TeamId } from '../types';

export interface TeamInfo {
  id: TeamId;
  name: string;         // 中文全名
  shortName: string;    // 簡稱
  color: string;        // 主色 (hex)
  secondaryColor: string;
  emoji: string;
}

export const TEAMS: Record<TeamId, TeamInfo> = {
  brothers: {
    id: 'brothers',
    name: '中信兄弟',
    shortName: '兄弟',
    color: '#FFD700',
    secondaryColor: '#000000',
    emoji: '🐘',
  },
  lions: {
    id: 'lions',
    name: '統一7-ELEVEn獅',
    shortName: '統一獅',
    color: '#FF8C00',
    secondaryColor: '#006400',
    emoji: '🦁',
  },
  monkeys: {
    id: 'monkeys',
    name: '樂天桃猿',
    shortName: '桃猿',
    color: '#CC0000',
    secondaryColor: '#003087',
    emoji: '🐒',
  },
  guardians: {
    id: 'guardians',
    name: '富邦悍將',
    shortName: '悍將',
    color: '#003087',
    secondaryColor: '#CC0000',
    emoji: '🛡️',
  },
  dragons: {
    id: 'dragons',
    name: '味全龍',
    shortName: '味全龍',
    color: '#006400',
    secondaryColor: '#FFD700',
    emoji: '🐉',
  },
  eagles: {
    id: 'eagles',
    name: '台鋼雄鷹',
    shortName: '雄鷹',
    color: '#C0392B',
    secondaryColor: '#2C3E50',
    emoji: '🦅',
  },
};

export const TEAM_LIST = Object.values(TEAMS);

export const STADIUMS = [
  '台北大巨蛋',
  '天母棒球場',
  '新莊棒球場',
  '洲際棒球場',
  '斗六棒球場',
  '澄清湖棒球場',
  '嘉義棒球場',
  '桃園國際棒球場',
];
