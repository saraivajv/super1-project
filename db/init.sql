-- Habilita a extensão para gerar UUIDs, caso ainda não esteja habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários: Armazena tanto clientes quanto prestadores.
CREATE TABLE IF NOT EXISTS users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'provider')), -- Garante que o role seja um dos valores permitidos
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Prestadores: Contém informações específicas dos prestadores.
CREATE TABLE IF NOT EXISTS providers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Se o usuário for deletado, o perfil de prestador também é.
bio TEXT,
phone_number VARCHAR(20),
profile_picture_url VARCHAR(255),
average_rating NUMERIC(3, 2) DEFAULT 0.00,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Tipos de Serviço: Categorias principais (Ex: Encanador, Eletricista).
CREATE TABLE IF NOT EXISTS service_types (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(100) UNIQUE NOT NULL,
description TEXT
);

-- Tabela de Serviços: O serviço específico oferecido por um prestador.
CREATE TABLE IF NOT EXISTS services (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE RESTRICT, -- Impede deletar um tipo de serviço se houver serviços associados.
title VARCHAR(255) NOT NULL,
description TEXT,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Variações de Serviço: Diferentes opções para um mesmo serviço (Ex: "Instalação Padrão", "Instalação Completa").
CREATE TABLE IF NOT EXISTS service_variations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
name VARCHAR(100) NOT NULL,
price NUMERIC(10, 2) NOT NULL,
duration_minutes INT, -- Duração estimada em minutos.
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Fotos do Serviço: Galeria de imagens para um serviço.
CREATE TABLE IF NOT EXISTS service_photos (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
photo_url VARCHAR(255) NOT NULL,
caption TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Disponibilidade do Prestador: Horários em que o prestador está disponível.
CREATE TABLE IF NOT EXISTS provider_availabilities (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
start_time TIME NOT NULL,
end_time TIME NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Agendamentos: Onde os agendamentos são registrados.
CREATE TABLE IF NOT EXISTS bookings (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
service_variation_id UUID NOT NULL REFERENCES service_variations(id),
booking_time TIMESTAMPTZ NOT NULL,
status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
final_price NUMERIC(10, 2),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Avaliações: Feedback dos clientes sobre os serviços.
CREATE TABLE IF NOT EXISTS reviews (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE, -- Cada agendamento só pode ter uma avaliação.
client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
comment TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para otimizar consultas comuns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);