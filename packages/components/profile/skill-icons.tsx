/**
 * Skill name → brand icon mapping.
 * Uses react-icons/si (Simple Icons) for modern tech with SVG icons,
 * and devicons CSS font classes for supplemental coverage (AWS, Azure, Java, etc).
 */

import 'devicons/css/devicons.min.css'

import {
  SiReact, SiNextdotjs, SiTypescript, SiJavascript, SiVuedotjs, SiSvelte, SiAngular,
  SiPython, SiRust, SiGo, SiPhp, SiRuby, SiKotlin, SiSwift, SiFlutter, SiDart,
  SiNodedotjs, SiDeno,
  SiDocker, SiKubernetes, SiTerraform, SiGithubactions, SiGithub,
  SiPostgresql, SiMysql, SiMongodb, SiRedis, SiSqlite,
  SiGraphql, SiApollographql,
  SiGooglecloud, SiCloudflare, SiVercel, SiNetlify,
  SiTailwindcss, SiCss3, SiHtml5, SiSass,
  SiUnity, SiUnrealengine, SiGodotengine, SiBlender, SiFigma,
  SiDiscord,
  SiLinux, SiUbuntu, SiDebian, SiArchlinux,
  SiElasticsearch, SiApachekafka,
  SiTensorflow, SiPytorch,
  SiCplusplus, SiDotnet,
  SiSupabase, SiFirebase, SiPrisma,
  SiWebassembly,
  SiGitlab,
} from 'react-icons/si'
import { type IconType } from 'react-icons'

type SiEntry = { type: 'si'; Icon: IconType; color: string }
type DiEntry = { type: 'di'; cls: string; color: string }
type IconEntry = SiEntry | DiEntry

function si(Icon: IconType, color: string): SiEntry { return { type: 'si', Icon, color } }
function di(cls: string, color: string): DiEntry { return { type: 'di', cls, color } }

const SKILL_ICON_MAP: Array<[RegExp, IconEntry]> = [
  // Frontend frameworks
  [/\breact\b/i,                si(SiReact,          '#61DAFB')],
  [/\bnext\.?js\b/i,            si(SiNextdotjs,      '#ffffff')],
  [/\bvue\b/i,                  si(SiVuedotjs,       '#42b883')],
  [/\bsvelte\b/i,               si(SiSvelte,         '#FF3E00')],
  [/\bangular\b/i,              si(SiAngular,        '#DD0031')],
  // Languages
  [/\btypescript\b/i,           si(SiTypescript,     '#3178C6')],
  [/\bjavascript\b/i,           si(SiJavascript,     '#F7DF1E')],
  [/\bpython\b/i,               di('devicons-python', '#3776AB')],
  [/\brust\b/i,                 di('devicons-rust',   '#CE422B')],
  [/\bgolang\b|\bgo\b/i,        di('devicons-go',     '#00ADD8')],
  [/\bphp\b/i,                  di('devicons-php',    '#777BB4')],
  [/\bruby\b/i,                 di('devicons-ruby',   '#CC342D')],
  [/\bkotlin\b/i,               si(SiKotlin,         '#7F52FF')],
  [/\bswift\b/i,                di('devicons-swift',  '#F05138')],
  [/\bflutter\b/i,              si(SiFlutter,        '#02569B')],
  [/\bdart\b/i,                 di('devicons-dart',   '#0175C2')],
  [/\bc\+\+\b|\bcpp\b/i,        si(SiCplusplus,      '#00599C')],
  [/\b\.net\b|dotnet/i,         di('devicons-dotnet', '#512BD4')],
  [/\bjava\b/i,                 di('devicons-java',   '#007396')],
  [/\bscala\b/i,                di('devicons-scala',  '#DC322F')],
  [/\bhaskell\b/i,              di('devicons-haskell','#5D4F85')],
  [/\bclojure\b/i,              di('devicons-clojure','#5881D8')],
  [/\bperl\b/i,                 di('devicons-perl',   '#39457E')],
  // Runtime / backend
  [/\bnode\.?js\b/i,            di('devicons-nodejs', '#339933')],
  [/\bdeno\b/i,                 si(SiDeno,           '#ffffff')],
  // Infrastructure / devops
  [/\bdocker\b/i,               si(SiDocker,         '#2496ED')],
  [/\bkubernetes\b|\bk8s\b/i,   si(SiKubernetes,     '#326CE5')],
  [/\bterraform\b/i,            si(SiTerraform,      '#7B42BC')],
  [/\bgithub actions\b/i,       si(SiGithubactions,  '#2088FF')],
  [/\bgithub\b/i,               di('devicons-github', '#ffffff')],
  [/\bgitlab\b/i,               si(SiGitlab,         '#FC6D26')],
  [/\bjenkins\b/i,              di('devicons-jenkins','#D33833')],
  [/\btravis\b/i,               di('devicons-travis', '#3EAAAF')],
  // Databases
  [/\bpostgres\b/i,             di('devicons-postgresql', '#4169E1')],
  [/\bmysql\b/i,                di('devicons-mysql',  '#4479A1')],
  [/\bmongo(db)?\b/i,           di('devicons-mongodb','#47A248')],
  [/\bredis\b/i,                di('devicons-redis',  '#DC382D')],
  [/\bsqlite\b/i,               si(SiSqlite,         '#003B57')],
  [/\belastic(search)?\b/i,     si(SiElasticsearch,  '#005571')],
  [/\bkafka\b/i,                si(SiApachekafka,    '#ffffff')],
  // APIs / data
  [/\bgraphql\b/i,              si(SiGraphql,        '#E10098')],
  [/\bapollo\b/i,               si(SiApollographql,  '#311C87')],
  // Cloud
  [/\baws\b|amazon web/i,       di('devicons-aws',    '#FF9900')],
  [/\bgcp\b|google cloud/i,     si(SiGooglecloud,    '#4285F4')],
  [/\bcloudflare\b/i,           si(SiCloudflare,     '#F38020')],
  [/\bvercel\b/i,               si(SiVercel,         '#ffffff')],
  [/\bnetlify\b/i,              si(SiNetlify,        '#00C7B7')],
  [/\bheroku\b/i,               di('devicons-heroku', '#430098')],
  // Styling
  [/\btailwind\b/i,             si(SiTailwindcss,    '#06B6D4')],
  [/\bcss\b/i,                  di('devicons-css3',   '#1572B6')],
  [/\bhtml\b/i,                 di('devicons-html5',  '#E34F26')],
  [/\bsass\b|\bscss\b/i,        di('devicons-sass',   '#CC6699')],
  [/\bless\b/i,                 di('devicons-less',   '#1D365D')],
  [/\bbootstrap\b/i,            di('devicons-bootstrap','#7952B3')],
  // Game dev / 3D
  [/\bunity\b/i,                di('devicons-unity_small','#222222')],
  [/\bunreal\b/i,               si(SiUnrealengine,   '#0E1128')],
  [/\bgodot\b/i,                si(SiGodotengine,    '#478CBF')],
  [/\bblender\b/i,              si(SiBlender,        '#EA7600')],
  [/\bfigma\b/i,                si(SiFigma,          '#F24E1E')],
  // ML / AI
  [/\btensorflow\b/i,           si(SiTensorflow,     '#FF6F00')],
  [/\bpytorch\b/i,              si(SiPytorch,        '#EE4C2C')],
  // BaaS
  [/\bsupabase\b/i,             si(SiSupabase,       '#3ECF8E')],
  [/\bfirebase\b/i,             di('devicons-firebase','#FFCA28')],
  [/\bprisma\b/i,               si(SiPrisma,         '#2D3748')],
  // Misc
  [/\bdiscord\b/i,              si(SiDiscord,        '#5865F2')],
  [/\bwebassembly\b|\bwasm\b/i, si(SiWebassembly,    '#654FF0')],
  [/\blinux\b/i,                di('devicons-linux',  '#FCC624')],
  [/\bubuntu\b/i,               di('devicons-ubuntu', '#E95420')],
  [/\bdebian\b/i,               di('devicons-debian', '#A81D33')],
  [/\barch\b/i,                 si(SiArchlinux,      '#1793D1')],
  [/\bjquery\b/i,               di('devicons-jquery', '#0769AD')],
  [/\bnpm\b/i,                  di('devicons-npm',    '#CB3837')],
  [/\bwordpress\b/i,            di('devicons-wordpress','#21759B')],
  [/\blaravel\b/i,              di('devicons-laravel','#FF2D20')],
  [/\bdjango\b/i,               di('devicons-django', '#092E20')],
  [/\bmeteor\b/i,               di('devicons-meteor', '#DE4F4F')],
]

export function getSkillIcon(name: string): IconEntry | null {
  for (const [pattern, entry] of SKILL_ICON_MAP) {
    if (pattern.test(name)) return entry
  }
  return null
}

export function SkillIcon({ name, className = 'w-3.5 h-3.5' }: { name: string; className?: string }) {
  const match = getSkillIcon(name)
  if (!match) return null
  if (match.type === 'si') {
    const { Icon, color } = match
    return <Icon className={className} style={{ color }} />
  }
  // devicons CSS font icon — size via fontSize since it's a font glyph
  return <i className={`devicons ${match.cls}`} style={{ color: match.color, fontSize: '0.875rem', lineHeight: 1 }} />
}
