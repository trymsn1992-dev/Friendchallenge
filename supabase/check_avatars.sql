-- Query to check participants and their avatars
SELECT 
    c.title,
    c.participants,
    p.full_name,
    p.avatar_url
FROM challenges c
LEFT JOIN profiles p ON p.id = ANY(c.participants);
