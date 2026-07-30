-- Create Supabase Schema for Unity Enterprises

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Settings Table (Singleton)
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'UNITY ENTERPRISES',
    mumbai_office_address TEXT NOT NULL DEFAULT 'A/5, Navjeevan seva society, Shingare wadi, Kurla (West), Mumbai- 400070.',
    contact_numbers TEXT NOT NULL DEFAULT '8623925697 / 8982691044',
    regd_office_address TEXT NOT NULL DEFAULT '344B, Walope, Tal- Chiplun, Dist- Ratnagiri-415605',
    gstin TEXT NOT NULL DEFAULT '27JTJPS1876M1ZL',
    bank_name TEXT NOT NULL DEFAULT 'Kotak Mahindra Bank Avashi branch Lote Parshuram',
    bank_account_no TEXT NOT NULL DEFAULT '5647987721',
    bank_ifsc TEXT NOT NULL DEFAULT 'KKBK0001994',
    email_invoice TEXT NOT NULL DEFAULT 'unityenterprises36@gmail.com',
    email_other TEXT NOT NULL DEFAULT 'sales@unitytech.in',
    logo_url TEXT,
    signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings row
INSERT INTO public.settings (business_name) VALUES ('UNITY ENTERPRISES');

-- 2. Clients Table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    gstin TEXT,
    kind_attention TEXT,
    email TEXT,
    mobile_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Suppliers Table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    gstin TEXT,
    mobile_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Item Catalog Table
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    ue_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    profit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Documents Table
CREATE TYPE document_type AS ENUM ('quotation', 'invoice', 'dc', 'po', 'wcc');
CREATE TYPE document_status AS ENUM ('Draft', 'Sent', 'In Process', 'Paid');

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type document_type NOT NULL,
    document_number TEXT NOT NULL,
    document_date DATE NOT NULL,
    status document_status NOT NULL DEFAULT 'Draft',
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, -- For chaining
    reference_number TEXT, -- E.g., Client PO number, Work Order number
    subject TEXT, -- For Quotations, DC
    subtotal NUMERIC(12, 2) DEFAULT 0,
    cgst NUMERIC(12, 2) DEFAULT 0,
    sgst NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    amount_in_words TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Extra fields like terms, WCC notes, delivery location
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Document Lines Table
CREATE TABLE public.document_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    make TEXT, -- specifically for WCC
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) - We are assuming a single tenant for this specific app (the owner),
-- so we can enable RLS and allow authenticated users full access.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for authenticated users only" ON public.settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.items FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated users only" ON public.document_lines FOR ALL TO authenticated USING (true);

-- Storage bucket for logos and signatures
insert into storage.buckets (id, name, public) values ('assets', 'assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON storage.objects;

CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT USING (bucket_id = 'assets');
CREATE POLICY "Enable insert for authenticated users only" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets');
CREATE POLICY "Enable update for authenticated users only" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'assets');
CREATE POLICY "Enable delete for authenticated users only" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assets');
