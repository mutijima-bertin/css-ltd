import pool from './db.js';

const seedData = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    const existingServices = await conn.query('SELECT COUNT(*) as count FROM services');
    if (Number(existingServices[0].count) === 0) {
      await conn.query(`
        INSERT INTO services (name, description, price, price_unit, category, sort_order) VALUES
        ('Studio Recording', 'Professional audio recording in our treated studio space. Includes mixing and mastering for up to 4 hours.', 150000, 'RWF', 'audio', 1),
        ('Mixing & Mastering', 'Professional mixing and mastering for your tracks. Delivered in 3-5 business days.', 80000, 'RWF', 'audio', 2),
        ('Event Photography', 'High-quality event photography coverage. Includes 200+ edited photos delivered within 48 hours.', 200000, 'RWF', 'photography', 3),
        ('Portrait Photography', 'Professional portrait sessions in studio or on location. Includes 20 edited high-res photos.', 100000, 'RWF', 'photography', 4),
        ('Video Production', 'Professional video shooting and editing for music videos, events, and commercials.', 350000, 'RWF', 'video', 5),
        ('Podcast Recording', 'Podcast recording and production services. Includes studio time and post-production.', 120000, 'RWF', 'audio', 6)
      `);
      console.log('Services seeded');
    }

    const existingPortfolio = await conn.query('SELECT COUNT(*) as count FROM portfolio_items');
    if (Number(existingPortfolio[0].count) === 0) {
      await conn.query(`
        INSERT INTO portfolio_items (title, category, description, media_url, thumbnail_url, youtube_url, is_featured) VALUES
        ('Kigali Music Festival 2026', 'event', 'Coverage of the annual Kigali Music Festival featuring top Rwandan artists.', '/placeholder-event-1.jpg', '/placeholder-thumb-1.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE),
        ('Studio Session - Alain Mwine', 'audio', 'Recording session with emerging Rwandan vocalist Alain Mwine.', '/placeholder-audio-1.jpg', '/placeholder-thumb-2.jpg', NULL, TRUE),
        ('Commercial Shoot - BK Arena', 'video', 'Corporate video production for BK Arena events promotion.', '/placeholder-video-1.jpg', '/placeholder-thumb-3.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ', TRUE),
        ('Nyamirambo Street Photography', 'photography', 'A series capturing the vibrant street life of Nyamirambo, Kigali.', '/placeholder-photo-1.jpg', '/placeholder-thumb-4.jpg', NULL, FALSE),
        ('Artist Spotlight - Ritah Teta', 'event', 'Behind the scenes and performance highlights of Ritah Teta at the studio.', '/placeholder-event-2.jpg', '/placeholder-thumb-5.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ', FALSE),
        ('Wedding Photography - M & J', 'photography', 'Full wedding day coverage at Kigali Serena Hotel.', '/placeholder-photo-2.jpg', '/placeholder-thumb-6.jpg', NULL, TRUE)
      `);
      console.log('Portfolio items seeded');
    }

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
};

seedData();
