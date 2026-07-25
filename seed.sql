-- Seed data for Unity Enterprises

-- Clients
INSERT INTO public.clients (id, name, address, gstin, kind_attention, email) VALUES
('c1000000-0000-4000-8000-000000000001', 'B. Chandra lab solutions', 'Goregaon (W), Mumbai – 400062', '27AAEPS949L1Z0', 'Mr. Chaitya', 'bchandralabsolutions@gmail.com'),
('c2000000-0000-4000-8000-000000000002', 'Somaiya Vidyavihar University', 'Vidyavihar, Mumbai', NULL, 'Mr. Dhruv Mittal', NULL),
('c3000000-0000-4000-8000-000000000003', 'KJ Somaiya Education Complex (SIRAC)', 'Vidyavihar, Mumbai – 400077', NULL, 'Mr. Mahesh Salvi', NULL)
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO public.suppliers (id, name, address, gstin) VALUES
('f1000000-0000-4000-8000-000000000001', 'Almonard Private Ltd.', '305 Kakad Chamber, third floor, Dr. Annie Besant Road, Worli, Mumbai – 400018', '27AABCA0188R1Z9')
ON CONFLICT DO NOTHING;

-- Items
INSERT INTO public.items (id, description, unit, rate) VALUES
('10000000-0000-4000-8000-000000000001', 'SITC of 3 core 2.5 sq mm copper flexible Polycab wire in 25mm PVC conduit & casing patti', 'Meters', 174.00),
('10000000-0000-4000-8000-000000000002', 'Supply & Installation of 6 Module Surface Box with Plate Legrand Myris with required accessories', 'No', 590.00),
('10000000-0000-4000-8000-000000000003', '6/16A Sockets Legrand Myris', 'No', 252.00),
('10000000-0000-4000-8000-000000000004', '6A Switch Legrand Myris', 'No', 74.00),
('10000000-0000-4000-8000-000000000005', 'Service for SAMSUNG & LG washing machines', 'Numbers', 1200.00),
('10000000-0000-4000-8000-000000000006', 'LG machine leg', 'Numbers', 150.00),
('10000000-0000-4000-8000-000000000007', 'LG motor belt', 'Numbers', 875.00),
('10000000-0000-4000-8000-000000000008', '160A 40KA four pole MCCB – Hager make', 'No', 8500.00),
('10000000-0000-4000-8000-000000000009', 'Spreader link for MCCB – Hager make', 'No', 1200.00),
('10000000-0000-4000-8000-000000000010', 'MCCB Enclosure Hinged door 4 pole x 160 frame MCCB', 'No', 4500.00),
('10000000-0000-4000-8000-000000000011', '24" Wall mount Air circulator, heavy duty, 1 phase, RPM 1400 OSC type with regulator', 'No', 10094.76),
('10000000-0000-4000-8000-000000000012', '160A 36kA FP MCCB, 160Amp Spreader link with suitable Metal Enclosure — Hager make', 'No', 9200.00),
('10000000-0000-4000-8000-000000000013', '4way TPN DB incomer 63A 10kA FP MCB 1no, Outgoing 16A 10kA SP MCB 12no per phase, Natural Separate with Earth link — Legrand make', 'No', 6800.00),
('10000000-0000-4000-8000-000000000014', 'SITC of 10 mm sq x 4 core cu Armored Polycab cable', 'Meters', 210.00)
ON CONFLICT DO NOTHING;

-- Documents

-- 1. Quotation for "Somaiya Vidyavihar University" using items 1–4
INSERT INTO public.documents (id, type, document_number, document_date, status, client_id, subject, subtotal, cgst, sgst, total) VALUES
('d1000000-0000-4000-8000-000000000001', 'quotation', 'Q-1001', CURRENT_DATE, 'Draft', 'c2000000-0000-4000-8000-000000000002', 'Requirement of switchboard at Engg building library 6th floor', (250*174)+(13*590)+(26*252)+(26*74), 0, 0, (250*174)+(13*590)+(26*252)+(26*74))
ON CONFLICT DO NOTHING;

INSERT INTO public.document_lines (document_id, item_id, description, quantity, unit, rate, amount, sort_order) VALUES
('d1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'SITC of 3 core 2.5 sq mm copper flexible Polycab wire in 25mm PVC conduit & casing patti', 250, 'Meters', 174.00, 250 * 174.00, 0),
('d1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Supply & Installation of 6 Module Surface Box with Plate Legrand Myris with required accessories', 13, 'No', 590.00, 13 * 590.00, 1),
('d1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '6/16A Sockets Legrand Myris', 26, 'No', 252.00, 26 * 252.00, 2),
('d1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '6A Switch Legrand Myris', 26, 'No', 74.00, 26 * 74.00, 3)
ON CONFLICT DO NOTHING;

-- 2. Invoice for "B. Chandra lab solutions" using items 5–7
INSERT INTO public.documents (id, type, document_number, document_date, status, client_id, subtotal, cgst, sgst, total) VALUES
('d2000000-0000-4000-8000-000000000002', 'invoice', 'INV-2001', CURRENT_DATE, 'Sent', 'c1000000-0000-4000-8000-000000000001', (9*1200)+(4*150)+(1*875), ((9*1200)+(4*150)+(1*875))*0.09, ((9*1200)+(4*150)+(1*875))*0.09, ((9*1200)+(4*150)+(1*875))*1.18)
ON CONFLICT DO NOTHING;

INSERT INTO public.document_lines (document_id, item_id, description, quantity, unit, rate, amount, sort_order) VALUES
('d2000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 'Service for SAMSUNG & LG washing machines', 9, 'Numbers', 1200.00, 9 * 1200.00, 0),
('d2000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006', 'LG machine leg', 4, 'Numbers', 150.00, 4 * 150.00, 1),
('d2000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', 'LG motor belt', 1, 'Numbers', 875.00, 1 * 875.00, 2)
ON CONFLICT DO NOTHING;

-- 3. DC for KJ Somaiya Education Complex
INSERT INTO public.documents (id, type, document_number, document_date, status, client_id, subject, subtotal, cgst, sgst, total) VALUES
('d3000000-0000-4000-8000-000000000003', 'dc', 'DC-3001', CURRENT_DATE, 'Sent', 'c3000000-0000-4000-8000-000000000003', 'MCCB and PDB for the UPS Supply System at SIRAC', 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.document_lines (document_id, item_id, description, quantity, unit, rate, amount, sort_order) VALUES
('d3000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008', '160A 40KA four pole MCCB – Hager make', 1, 'No', 0, 0, 0),
('d3000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000009', 'Spreader link for MCCB – Hager make', 1, 'No', 0, 0, 1),
('d3000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000010', 'MCCB Enclosure Hinged door 4 pole x 160 frame MCCB', 1, 'No', 0, 0, 2)
ON CONFLICT DO NOTHING;

-- 4. PO to supplier Almonard Private Ltd.
INSERT INTO public.documents (id, type, document_number, document_date, status, supplier_id, subtotal, cgst, sgst, total) VALUES
('d4000000-0000-4000-8000-000000000004', 'po', 'PO-4001', CURRENT_DATE, 'Sent', 'f1000000-0000-4000-8000-000000000001', 6*10094.76, (6*10094.76)*0.09, (6*10094.76)*0.09, (6*10094.76)*1.18)
ON CONFLICT DO NOTHING;

INSERT INTO public.document_lines (document_id, item_id, description, quantity, unit, rate, amount, sort_order) VALUES
('d4000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000011', '24" Wall mount Air circulator, heavy duty, 1 phase, RPM 1400 OSC type with regulator', 6, 'No', 10094.76, 6 * 10094.76, 0)
ON CONFLICT DO NOTHING;

-- 5. WCC for KJ Somaiya Education Complex
INSERT INTO public.documents (id, type, document_number, document_date, status, client_id, subtotal, cgst, sgst, total) VALUES
('d5000000-0000-4000-8000-000000000005', 'wcc', 'WCC-5001', CURRENT_DATE, 'Paid', 'c3000000-0000-4000-8000-000000000003', 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.document_lines (document_id, item_id, description, quantity, unit, rate, amount, sort_order) VALUES
('d5000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000012', '160A 36kA FP MCCB, 160Amp Spreader link with suitable Metal Enclosure — Hager make', 1, 'No', 0, 0, 0),
('d5000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000013', '4way TPN DB incomer 63A 10kA FP MCB 1no, Outgoing 16A 10kA SP MCB 12no per phase, Natural Separate with Earth link — Legrand make', 1, 'No', 0, 0, 1),
('d5000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000014', 'SITC of 10 mm sq x 4 core cu Armored Polycab cable', 1, 'Meters', 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Log confirmation counts
DO $$ 
DECLARE
  items_count integer;
  clients_count integer;
  suppliers_count integer;
  docs_count integer;
BEGIN
  SELECT COUNT(*) INTO items_count FROM public.items;
  SELECT COUNT(*) INTO clients_count FROM public.clients;
  SELECT COUNT(*) INTO suppliers_count FROM public.suppliers;
  SELECT COUNT(*) INTO docs_count FROM public.documents;
  
  RAISE NOTICE 'Seeded successfully: % Items, % Clients, % Suppliers, % Documents inserted total.', items_count, clients_count, suppliers_count, docs_count;
END $$;
