const genshinCharacters = `
albedo|Albedo
alhaitham|Alhaitham
aloy|Aloy
amber|Amber
arataki-itto|Arataki Itto
arlecchino|Arlecchino
baizhu|Baizhu
barbara|Barbara
beidou|Beidou
bennett|Bennett
candace|Candace
charlotte|Charlotte
chevreuse|Chevreuse
chongyun|Chongyun
citlali|Citlali
clorinde|Clorinde
collei|Collei
cyno|Cyno
dehya|Dehya
diluc|Diluc
diona|Diona
dori|Dori
emilie|Emilie
eula|Eula
faruzan|Faruzan
fischl|Fischl
freminet|Freminet
furina|Furina
gaming|Gaming
ganyu|Ganyu
gorou|Gorou
hu-tao|Hu Tao
ifa|Ifa
ineffa|Ineffa
iansan|Iansan
jean|Jean
kaedehara-kazuha|Kaedehara Kazuha
kaeya|Kaeya
kamisato-ayaka|Kamisato Ayaka
kamisato-ayato|Kamisato Ayato
kaveh|Kaveh
keqing|Keqing
kinich|Kinich
kirara|Kirara
klee|Klee
kujou-sara|Kujou Sara
kuki-shinobu|Kuki Shinobu
lauma|Lauma
layla|Layla
lisa|Lisa
lynette|Lynette
lyney|Lyney
mika|Mika
mona|Mona
mualani|Mualani
nahida|Nahida
navia|Navia
nefer|Nefer
neuvillette|Neuvillette
nilou|Nilou
ningguang|Ningguang
noelle|Noelle
ororon|Ororon
qiqi|Qiqi
raiden-shogun|Raiden Shogun
razor|Razor
rosaria|Rosaria
sangonomiya-kokomi|Sangonomiya Kokomi
sayu|Sayu
sethos|Sethos
shenhe|Shenhe
shikanoin-heizou|Shikanoin Heizou
sigewinne|Sigewinne
skirk|Skirk
sucrose|Sucrose
tartaglia|Tartaglia
thoma|Thoma
tighnari|Tighnari
varesa|Varesa
venti|Venti
vesna|Vesna
vodyanitsa|Vodyanitsa
wanderer|Wanderer
wriothesley|Wriothesley
xiangling|Xiangling
xianyun|Xianyun
xiao|Xiao
xingqiu|Xingqiu
xinyan|Xinyan
yae-miko|Yae Miko
yanfei|Yanfei
yaoyao|Yaoyao
yelan|Yelan
yoimiya|Yoimiya
yun-jin|Yun Jin
zhongli|Zhongli`.trim();

const zzzCharacters = `
alice|Alice
anby|Anby
anton|Anton
aria|Aria
astra-yao|Astra Yao
banyue|Banyue
ben|Ben
billy|Billy
burnice|Burnice
caesar|Caesar King
cissia|Cissia
claret|Claret
corin|Corin
dialyn|Dialyn
ellen|Ellen Joe
evelyn|Evelyn
grace|Grace Howard
harumasa|Asaba Harumasa
hugo|Hugo Vlad
jane|Jane Doe
ju-fufu|Ju Fufu
koleda|Koleda Belobog
lighter|Lighter
lucia|Lucia
lucy|Lucy
lycaon|Von Lycaon
manato|Manato
miyabi|Hoshimi Miyabi
nangong-yu|Nangong Yu
nekomata|Nekomata
nicole|Nicole Demara
norma|Norma
orphie-magus|Orphie & Magus
pan-yinhu|Pan Yinhu
phoenix|Phoenix
piper|Piper
promeia|Promeia
pulchra|Pulchra
pyrois|Pyrois
qingyi|Qingyi
remielle|Remielle
rina|Alexandrina Sebastiane
roxy|Roxy
seed|Seed
seth|Seth Lowell
severian|Severian
sigrid|Sigrid
soldier-0-anby|Soldier 0 - Anby
soldier-11|Soldier 11
soukaku|Soukaku
starlight-billy|Starlight Billy
sunna|Sunna
trigger|Trigger
velina|Velina
vivian|Vivian
yanagi|Tsukishiro Yanagi
ye-shunguang|Ye Shunguang
yidhari|Yidhari
yixuan|Yixuan
yuzuha|Yuzuha
zhao|Zhao`.trim();

function parseCharacters(rows) {
    return rows.split('\n').map(row => {
        const [id, name] = row.split('|');
        return { id, name };
    });
}

export const GACHA_GAMES = [
    { id: 'genshin', name: 'Genshin Impact', icon: '✦' },
    { id: 'zzz', name: 'Zenless Zone Zero', icon: '◈' }
];

export const GACHA_CATALOG = {
    genshin: parseCharacters(genshinCharacters),
    zzz: parseCharacters(zzzCharacters)
};

export function getCharacter(game, characterId) {
    return GACHA_CATALOG[game]?.find(character => character.id === characterId) || null;
}

export function getCharacterArtwork(game, characterId) {
    if (game === 'genshin') {
        const assetNames = {
            amber: 'Ambor',
            'arataki-itto': 'Itto',
            'hu-tao': 'Hutao',
            'kaedehara-kazuha': 'Kazuha',
            'kamisato-ayaka': 'Ayaka',
            'kamisato-ayato': 'Ayato',
            'kujou-sara': 'Sara',
            'kuki-shinobu': 'Shinobu',
            'raiden-shogun': 'Shougun',
            'sangonomiya-kokomi': 'Kokomi',
            'shikanoin-heizou': 'Heizou',
            'yae-miko': 'Yae',
            'xianyun': 'Liuyun',
            'yun-jin': 'Yunjin'
        };
        const assetName = assetNames[characterId] || characterId.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
        return `https://enka.network/ui/UI_AvatarIcon_${assetName}.png`;
    }
    if (game === 'zzz') return `https://raw.githubusercontent.com/Gaiiiaaa-GH/ZZZdle-Assets/master/portraits/${encodeURIComponent(characterId)}.webp`;
    return '';
}

export function getGameName(game) {
    return GACHA_GAMES.find(item => item.id === game)?.name || game;
}