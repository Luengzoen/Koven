import type { LocaleId } from './locale'

export const messageKeys = [
  // A. sidebar / nav
  'nav.sectionOverview',
  'nav.overview',
  'nav.recent',
  'nav.starred',
  'nav.sectionProjects',
  'nav.searchPlaceholder',
  'nav.systemSettings',
  'nav.theme',
  'nav.themeSystem',
  'nav.themeLight',
  'nav.themeDark',
  'nav.preferences',
  'nav.about',
  'nav.checkUpdates',
  'nav.help',
  'nav.newTask',
  'nav.taskMenu',
  'nav.statusInProgress',
  'nav.statusDone',
  'nav.statusFailed',
  'nav.resizeSidebar',
  'nav.collapseSidebar',
  'nav.expandSidebar',
  'nav.back',
  'nav.backTo',

  // B. placeholder
  'placeholder.comingSoon',

  // C. preferences shell
  'prefs.sectionGeneral',
  'prefs.sectionSystem',
  'prefs.searchSettings',
  'prefs.settingsSections',
  'prefs.noMatchingSections',

  // D. general
  'general.text',
  'general.font',
  'general.fontDescription',
  'general.fontSize',
  'general.fontSizeDescription',
  'general.fontSizeSmall',
  'general.fontSizeDefault',
  'general.fontSizeLarge',
  'general.fontSizeXs',
  'general.fontSizeSm',
  'general.fontSizeMd',
  'general.fontSizeLg',
  'general.fontSizeXl',
  'general.language',
  'general.languageDescription',
  'general.localeZhCN',
  'general.localeEn',

  // E. system
  'system.window',
  'system.onClose',
  'system.onCloseDescription',
  'system.hideToTray',
  'system.quit',
  'system.closeBehavior',

  // F. about
  'about.title',
  'about.description',
  'about.version',
  'about.loadingVersion',
  'about.checkUpdates',
  'about.copyVersion',
  'about.versionCopied',
  'about.copyFailed',
  'about.updatesUnavailable',
  'about.copyright',

  // G. common
  'common.close',
  'common.search',

  // H. main
  'tray.showMainWindow',
  'tray.settings',
  'tray.quit',
  'paths.dataNotWritableTitle',
  'paths.dataNotWritableBody'
] as const

export type MessageKey = (typeof messageKeys)[number]

type Catalog = Record<MessageKey, string>

const zhCN: Catalog = {
  'nav.sectionOverview': '概览',
  'nav.overview': '概览',
  'nav.recent': '最近',
  'nav.starred': '收藏',
  'nav.sectionProjects': '项目',
  'nav.searchPlaceholder': '搜索...',
  'nav.systemSettings': '系统设置',
  'nav.theme': '主题',
  'nav.themeSystem': '跟随系统',
  'nav.themeLight': '浅色',
  'nav.themeDark': '深色',
  'nav.preferences': '首选项',
  'nav.about': '关于',
  'nav.checkUpdates': '检查更新',
  'nav.help': '帮助',
  'nav.newTask': '新建任务',
  'nav.taskMenu': '任务菜单',
  'nav.statusInProgress': '进行中',
  'nav.statusDone': '完成',
  'nav.statusFailed': '失败',
  'nav.resizeSidebar': '调整侧栏宽度',
  'nav.collapseSidebar': '收起侧栏',
  'nav.expandSidebar': '展开侧栏',
  'nav.back': '返回',
  'nav.backTo': '返回{title}',

  'placeholder.comingSoon': '页面内容稍后提供',

  'prefs.sectionGeneral': '通用',
  'prefs.sectionSystem': '系统',
  'prefs.searchSettings': '搜索设置',
  'prefs.settingsSections': '设置分类',
  'prefs.noMatchingSections': '没有匹配的分类',

  'general.text': '文字',
  'general.font': '字体',
  'general.fontDescription': '选择界面使用的中文字体',
  'general.fontSize': '字体大小',
  'general.fontSizeDescription': '调整界面文字整体大小',
  'general.fontSizeSmall': '小',
  'general.fontSizeDefault': '默认',
  'general.fontSizeLarge': '大',
  'general.fontSizeXs': '极小',
  'general.fontSizeSm': '小',
  'general.fontSizeMd': '标准',
  'general.fontSizeLg': '稍大',
  'general.fontSizeXl': '大',
  'general.language': '语言',
  'general.languageDescription': '选择界面显示语言',
  'general.localeZhCN': '简体中文',
  'general.localeEn': 'English',

  'system.window': '窗口',
  'system.onClose': '关闭时',
  'system.onCloseDescription': '点击窗口关闭按钮时的行为',
  'system.hideToTray': '隐藏到托盘',
  'system.quit': '退出主程序',
  'system.closeBehavior': '关闭时行为',

  'about.title': '关于 Koven',
  'about.description': '查看应用版本，并复制版本信息',
  'about.version': '版本 {v}',
  'about.loadingVersion': '正在加载版本信息',
  'about.checkUpdates': '检查更新…',
  'about.copyVersion': '复制版本信息',
  'about.versionCopied': '版本信息已复制',
  'about.copyFailed': '复制失败，请稍后重试',
  'about.updatesUnavailable': '暂时无法检查更新',
  'about.copyright': 'Copyright © {year} Koven. All rights reserved.',

  'common.close': '关闭',
  'common.search': '搜索',

  'tray.showMainWindow': '显示主窗口',
  'tray.settings': '设置',
  'tray.quit': '退出 Koven',
  'paths.dataNotWritableTitle': '数据目录不可写',
  'paths.dataNotWritableBody':
    '程序安装目录没有写入权限，应用数据将保存到系统默认位置。\n建议安装到可写目录（如 D:\\Program Files\\Koven）。'
}

const en: Catalog = {
  'nav.sectionOverview': 'Overview',
  'nav.overview': 'Overview',
  'nav.recent': 'Recent',
  'nav.starred': 'Starred',
  'nav.sectionProjects': 'Projects',
  'nav.searchPlaceholder': 'Search…',
  'nav.systemSettings': 'System settings',
  'nav.theme': 'Theme',
  'nav.themeSystem': 'System',
  'nav.themeLight': 'Light',
  'nav.themeDark': 'Dark',
  'nav.preferences': 'Preferences',
  'nav.about': 'About',
  'nav.checkUpdates': 'Check for updates',
  'nav.help': 'Help',
  'nav.newTask': 'New task',
  'nav.taskMenu': 'Task menu',
  'nav.statusInProgress': 'In progress',
  'nav.statusDone': 'Done',
  'nav.statusFailed': 'Failed',
  'nav.resizeSidebar': 'Resize sidebar',
  'nav.collapseSidebar': 'Collapse sidebar',
  'nav.expandSidebar': 'Expand sidebar',
  'nav.back': 'Back',
  'nav.backTo': 'Back to {title}',

  'placeholder.comingSoon': 'Page content coming soon',

  'prefs.sectionGeneral': 'General',
  'prefs.sectionSystem': 'System',
  'prefs.searchSettings': 'Search settings',
  'prefs.settingsSections': 'Settings sections',
  'prefs.noMatchingSections': 'No matching sections',

  'general.text': 'Text',
  'general.font': 'Font',
  'general.fontDescription': 'Choose the UI font',
  'general.fontSize': 'Font size',
  'general.fontSizeDescription': 'Adjust overall UI text size',
  'general.fontSizeSmall': 'Small',
  'general.fontSizeDefault': 'Default',
  'general.fontSizeLarge': 'Large',
  'general.fontSizeXs': 'Tiny',
  'general.fontSizeSm': 'Small',
  'general.fontSizeMd': 'Medium',
  'general.fontSizeLg': 'Large',
  'general.fontSizeXl': 'Extra large',
  'general.language': 'Language',
  'general.languageDescription': 'Choose the display language',
  'general.localeZhCN': '简体中文',
  'general.localeEn': 'English',

  'system.window': 'Window',
  'system.onClose': 'On close',
  'system.onCloseDescription': 'What happens when you close the window',
  'system.hideToTray': 'Hide to tray',
  'system.quit': 'Quit',
  'system.closeBehavior': 'Close behavior',

  'about.title': 'About Koven',
  'about.description': 'View the app version and copy it',
  'about.version': 'Version {v}',
  'about.loadingVersion': 'Loading version…',
  'about.checkUpdates': 'Check for updates…',
  'about.copyVersion': 'Copy version',
  'about.versionCopied': 'Version copied',
  'about.copyFailed': 'Couldn’t copy. Try again later.',
  'about.updatesUnavailable': 'Updates aren’t available yet',
  'about.copyright': 'Copyright © {year} Koven. All rights reserved.',

  'common.close': 'Close',
  'common.search': 'Search',

  'tray.showMainWindow': 'Show main window',
  'tray.settings': 'Settings',
  'tray.quit': 'Quit Koven',
  'paths.dataNotWritableTitle': 'Data folder isn’t writable',
  'paths.dataNotWritableBody':
    'Install folder isn’t writable; data will use the system default location.\nPrefer a writable install path (for example D:\\Program Files\\Koven).'
}

export const catalogs: Record<LocaleId, Catalog> = {
  'zh-CN': zhCN,
  en
}
