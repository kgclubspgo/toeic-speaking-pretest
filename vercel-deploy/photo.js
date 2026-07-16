// Vercel Serverless Function: /api/photo
// Pixabay API 키는 Vercel 프로젝트의 환경변수(PIXABAY_API_KEY)에만 보관한다.

const TOPICS = [
  'people talking',
  'people working office',
  'family',
  'friends',
  'people shopping',
  'people cooking',
  'people walking street',
  'business people meeting',
  'people eating restaurant',
  'people outdoor park'
];

module.exports = async (req, res) => {
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  if (!PIXABAY_API_KEY) {
    res.status(500).json({ error: 'PIXABAY_API_KEY가 Vercel 환경변수에 설정되어 있지 않습니다.' });
    return;
  }
  try {
    const q = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const page = Math.floor(Math.random() * 8) + 1;
    const searchUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&category=people&image_type=photo&orientation=horizontal&safesearch=true&editors_choice=true&min_width=640&min_height=480&per_page=50&page=${page}`;

    const sr = await fetch(searchUrl);
    if (!sr.ok) {
      const t = await sr.text();
      res.status(sr.status).json({ error: 'Pixabay 검색 실패: ' + t });
      return;
    }
    const sdata = await sr.json();
    let hits = sdata.hits || [];

    if (hits.length < 5) {
      const fallbackUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&category=people&image_type=photo&orientation=horizontal&safesearch=true&min_width=640&min_height=480&per_page=50&page=1`;
      const fr = await fetch(fallbackUrl);
      if (fr.ok) {
        const fdata = await fr.json();
        hits = fdata.hits || [];
      }
    }

    if (!hits.length) {
      res.status(404).json({ error: '조건에 맞는 이미지를 찾지 못했습니다.' });
      return;
    }
    const pick = hits[Math.floor(Math.random() * hits.length)];
    const imgUrl = pick.largeImageURL || pick.webformatURL;

    const ir = await fetch(imgUrl);
    const arrayBuf = await ir.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString('base64');
    const mediaType = ir.headers.get('content-type') || 'image/jpeg';

    res.status(200).json({ url: imgUrl, base64, mediaType, topic: q, credit: `Photo via Pixabay (user: ${pick.user})` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
