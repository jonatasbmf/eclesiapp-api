# 🏛️ Church System — Arquitetura Completa

---

## 1. FLUXO LÓGICO — Visão Hierárquica

```
ORGANIZAÇÃO (Igreja Boas Novas)
│
├── UNIDADE FÍSICA (Estoril) [CNPJ próprio]
│   ├── SETOR COMERCIAL (Livraria, Loja, Lanchonete)
│   │   ├── Estoque próprio
│   │   ├── Contas a pagar/receber (vinculadas à Unidade fiscal)
│   │   └── Vendas (vinculadas a Eventos)
│   │
│   ├── SETOR VIRTUAL (Cozinha, Recepção)
│   │   └── Estoque (sem compra/venda própria)
│   │
│   └── MINISTÉRIOS (organismos filhos)
│       ├── Staff
│       │   └── Família Levi / Família Juda
│       ├── Consolidação
│       ├── Intercessão
│       ├── Mídia
│       └── Célula
│           ├── Rede Amarela
│           │   └── Célula X (Líder, Co-líder, Membros)
│           └── Rede Azul
│               └── Célula Y
│
└── UNIDADE FÍSICA (Boulevard) [CNPJ próprio]
    └── (mesma estrutura)
```

---

## 2. FLUXO DE PESSOA / MEMBRO

```
VISITANTE (cadastro isolado)
    │
    ▼ solicita associação
PESSOA (cadastro normalizado)
    │
    ▼ aprovação pela unidade
MEMBRO (extends Pessoa)
    │
    ├── associado a 1+ Organismos → recebe TAGs automáticas
    │   BN:Estoril:Staff:Levi:Associado
    │   BN:Estoril:Célula:RedeAzul:CélulaY:Membro
    │
    ├── Papel Ministerial (Pastor, Líder, Co-líder...)
    │
    └── Usuário do sistema → Grupo de Permissão
```

---

## 3. FLUXO DE EVENTO

```
EVENTO (criado por organizador)
    │
    ├── Tipo: Culto, Vigília, Curso, Seminário...
    ├── Escopo: Público / Só Membros / Só Unidade
    │
    ├── Ministérios associados ao evento
    │   └── Check-in de membros → controle de presença
    │
    ├── Setores ativos no evento
    │   └── Pessoas atribuídas ao setor no evento → permissão de venda
    │
    └── Vendas (podem ocorrer antes da data do evento)
        └── PDV por setor
```

---

## 4. MÓDULOS NEST.JS

### Módulo 1 — `OrganizationModule`
- Organização (raiz)
- Organismo (árvore com Materialized Path)
- Categoria de Organismo
- Hierarquia de categorias

### Módulo 2 — `PersonModule`
- Pessoa (base normalizada)
- Pessoa Física
- Pessoa Jurídica
- Endereço
- Visitante (cadastro isolado)

### Módulo 3 — `MemberModule`
- Membro (extends Pessoa)
- Associação Membro ↔ Organismo
- TAG automática por associação
- Papel ministerial
- Fluxo de aprovação de associação

### Módulo 4 — `AuthModule`
- Usuário
- Grupo de Permissão
- Item de Permissão
- Vínculo Usuário ↔ Grupo

### Módulo 5 — `EventModule`
- Evento
- Tipo de Evento
- Ministérios no Evento
- Check-in / Presença
- Organizador e equipe

### Módulo 6 — `SectorModule`
- Setor (físico ou virtual)
- Setor comercial × virtual
- Pessoa atribuída ao setor por evento

### Módulo 7 — `SupplyModule`
- Categoria de Material
- Material (produto/insumo)
- Unidade de medida + conversão
- Estoque por setor
- Movimentação de estoque
- Pedido de compra

### Módulo 8 — `SalesModule`
- PDV por setor
- Venda (vinculada a evento + setor)
- Item de venda
- Formas de pagamento

### Módulo 9 — `FinanceModule`
- Conta a pagar
- Conta a receber
- Vínculo com Unidade fiscal (CNPJ)

---

## 5. SCHEMA PRISMA (PostgreSQL)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// MÓDULO: ORGANIZAÇÃO / ORGANISMO
// ─────────────────────────────────────────────

model Organization {
  id          String     @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  organisms   Organism[]
}

/// Categoria define o tipo do organismo e sua posição na hierarquia
model OrganismCategory {
  id               String             @id @default(uuid())
  name             String             @unique // Matriz, Unidade, Ministério, Família, Célula...
  parentCategoryId String?
  parentCategory   OrganismCategory?  @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  childCategories  OrganismCategory[] @relation("CategoryHierarchy")
  organisms        Organism[]

  @@index([parentCategoryId])
}

model Organism {
  id             String           @id @default(uuid())
  name           String
  slug           String           // segmento do path
  path           String           // MATERIALIZED PATH ex: BN.Estoril.Staff.Levi
  depth          Int              // nível na hierarquia
  isPhysical     Boolean          @default(false)
  isCommercial   Boolean          @default(false) // setor comercial
  cnpj           String?
  tagTemplate    String?          // template da tag ex: BN:Estoril:Staff:Levi

  organizationId String
  organization   Organization     @relation(fields: [organizationId], references: [id])

  categoryId     String
  category       OrganismCategory @relation(fields: [categoryId], references: [id])

  parentId       String?
  parent         Organism?        @relation("OrganismTree", fields: [parentId], references: [id])
  children       Organism[]       @relation("OrganismTree")

  addressId      String?
  address        Address?         @relation(fields: [addressId], references: [id])

  memberLinks    MemberOrganism[]
  eventOrganisms EventOrganism[]
  sectorEvents   SectorEvent[]
  stocks         Stock[]
  financeTitles  FinanceTitle[]

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([path])          // índice para busca por path (evita recursão)
  @@index([depth])
  @@index([organizationId])
  @@index([parentId])
}

// ─────────────────────────────────────────────
// MÓDULO: PESSOA
// ─────────────────────────────────────────────

model Address {
  id           String     @id @default(uuid())
  street       String
  number       String?
  complement   String?
  neighborhood String?
  zipCode      String
  cityId       String
  city         City       @relation(fields: [cityId], references: [id])
  persons      Person[]
  organisms    Organism[]

  @@index([cityId])
}

model Country {
  id     String  @id @default(uuid())
  name   String
  iso2   String  @unique
  states State[]
}

model State {
  id        String  @id @default(uuid())
  name      String
  uf        String  @unique
  countryId String
  country   Country @relation(fields: [countryId], references: [id])
  cities    City[]

  @@index([countryId])
}

model City {
  id        String    @id @default(uuid())
  name      String
  stateId   String
  state     State     @relation(fields: [stateId], references: [id])
  addresses Address[]

  @@index([stateId])
}

model Person {
  id        String      @id @default(uuid())
  email     String?     @unique
  phone     String?
  photoUrl  String?
  addressId String?
  address   Address?    @relation(fields: [addressId], references: [id])

  individual   IndividualPerson?
  company      CompanyPerson?
  member       Member?
  user         User?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model IndividualPerson {
  id           String    @id @default(uuid())
  personId     String    @unique
  person       Person    @relation(fields: [personId], references: [id])
  firstName    String
  lastName     String
  cpf          String?   @unique
  birthDate    DateTime?
  gender       Gender?
}

model CompanyPerson {
  id           String  @id @default(uuid())
  personId     String  @unique
  person       Person  @relation(fields: [personId], references: [id])
  razaoSocial  String
  nomeFantasia String?
  cnpj         String  @unique
  ie           String?
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

/// Visitante é isolado para não sujar o cadastro principal
model Visitor {
  id        String   @id @default(uuid())
  firstName String
  lastName  String
  email     String?
  phone     String?
  notes     String?
  unitId    String?  // unidade que visitou
  visitedAt DateTime @default(now())
  createdAt DateTime @default(now())

  @@index([email])
}

// ─────────────────────────────────────────────
// MÓDULO: MEMBRO
// ─────────────────────────────────────────────

model Member {
  id               String           @id @default(uuid())
  personId         String           @unique
  person           Person           @relation(fields: [personId], references: [id])
  enrollmentDate   DateTime?
  ministerialRole  MinisterialRole?
  status           MemberStatus     @default(ACTIVE)

  organisms        MemberOrganism[]
  tags             MemberTag[]
  checkIns         EventCheckIn[]

  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

enum MemberStatus {
  PENDING    // aguardando aprovação
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum MinisterialRole {
  PASTOR_PRESIDENTE
  PASTOR
  LIDER
  CO_LIDER
  TESOUREIRO
  SECRETARIO
  DIACONO
  ASSOCIADO
  MEMBRO
}

/// Associação Membro ↔ Organismo → gera TAG automaticamente
model MemberOrganism {
  id         String   @id @default(uuid())
  memberId   String
  member     Member   @relation(fields: [memberId], references: [id])
  organismId String
  organism   Organism @relation(fields: [organismId], references: [id])
  role       String   // papel neste organismo específico
  tag        String   // gerada automaticamente pelo path + role

  joinedAt   DateTime @default(now())
  leftAt     DateTime?

  @@unique([memberId, organismId, role])
  @@index([memberId])
  @@index([organismId])
  @@index([tag])
}

model MemberTag {
  id       String @id @default(uuid())
  memberId String
  member   Member @relation(fields: [memberId], references: [id])
  tag      String // BN:Estoril:Staff:Levi:Associado

  @@unique([memberId, tag])
  @@index([tag])
}

// ─────────────────────────────────────────────
// MÓDULO: AUTH / PERMISSÃO
// ─────────────────────────────────────────────

model User {
  id            String          @id @default(uuid())
  personId      String          @unique
  person        Person          @relation(fields: [personId], references: [id])
  username      String          @unique
  passwordHash  String
  isActive      Boolean         @default(true)

  groups        UserGroup[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model PermissionGroup {
  id          String           @id @default(uuid())
  name        String           @unique // visitante, membro, lider, admin
  description String?
  users       UserGroup[]
  items       PermissionItem[]
}

model PermissionItem {
  id          String          @id @default(uuid())
  groupId     String
  group       PermissionGroup @relation(fields: [groupId], references: [id])
  resource    String          // ex: "organisms", "members", "events"
  action      String          // ex: "read", "write", "delete"
  scope       String?         // ex: "own_unit", "all"

  @@unique([groupId, resource, action])
  @@index([groupId])
}

model UserGroup {
  userId  String
  user    User            @relation(fields: [userId], references: [id])
  groupId String
  group   PermissionGroup @relation(fields: [groupId], references: [id])

  @@id([userId, groupId])
}

// ─────────────────────────────────────────────
// MÓDULO: EVENTO
// ─────────────────────────────────────────────

model EventType {
  id     String  @id @default(uuid())
  name   String  @unique // Culto, Vigília, Curso, Seminário, Imersão
  events Event[]
}

model Event {
  id           String          @id @default(uuid())
  title        String
  description  String?
  typeId       String
  type         EventType       @relation(fields: [typeId], references: [id])
  scope        EventScope      @default(PUBLIC)
  startDate    DateTime
  endDate      DateTime?
  organizerId  String          // memberId do organizador
  unitId       String?         // organismo unidade (se restrito)

  organisms    EventOrganism[]
  sectorEvents SectorEvent[]
  checkIns     EventCheckIn[]
  sales        Sale[]

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([startDate])
  @@index([unitId])
}

enum EventScope {
  PUBLIC
  MEMBERS_ONLY
  UNIT_ONLY
}

model EventOrganism {
  id         String   @id @default(uuid())
  eventId    String
  event      Event    @relation(fields: [eventId], references: [id])
  organismId String
  organism   Organism @relation(fields: [organismId], references: [id])
  role       String?  // louvor, intercessão, consolidação...

  @@unique([eventId, organismId])
  @@index([eventId])
}

model EventCheckIn {
  id        String   @id @default(uuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  memberId  String
  member    Member   @relation(fields: [memberId], references: [id])
  role      String?  // papel no evento
  checkedAt DateTime @default(now())

  @@unique([eventId, memberId])
  @@index([eventId])
  @@index([memberId])
}

// ─────────────────────────────────────────────
// MÓDULO: SETOR / PDV
// ─────────────────────────────────────────────

/// Setor ativo em um evento com pessoas atribuídas
model SectorEvent {
  id         String              @id @default(uuid())
  eventId    String
  event      Event               @relation(fields: [eventId], references: [id])
  organismId String              // organismo do tipo setor
  organism   Organism            @relation(fields: [organismId], references: [id])
  persons    SectorEventPerson[]
  sales      Sale[]

  @@unique([eventId, organismId])
  @@index([eventId])
}

model SectorEventPerson {
  id            String      @id @default(uuid())
  sectorEventId String
  sectorEvent   SectorEvent @relation(fields: [sectorEventId], references: [id])
  memberId      String
  canSell       Boolean     @default(false)

  @@unique([sectorEventId, memberId])
}

// ─────────────────────────────────────────────
// MÓDULO: SUPRIMENTOS
// ─────────────────────────────────────────────

model MaterialCategory {
  id        String     @id @default(uuid())
  name      String
  parentId  String?
  parent    MaterialCategory?  @relation("MatCatTree", fields: [parentId], references: [id])
  children  MaterialCategory[] @relation("MatCatTree")
  materials Material[]
}

model UnitOfMeasure {
  id          String             @id @default(uuid())
  name        String             @unique // unidade, caixa, kg, litro
  symbol      String             @unique
  conversions UnitConversion[]   @relation("FromUnit")
  materials   Material[]
}

model UnitConversion {
  id         String        @id @default(uuid())
  fromUnitId String
  fromUnit   UnitOfMeasure @relation("FromUnit", fields: [fromUnitId], references: [id])
  toUnitId   String
  factor     Decimal       // ex: 1 caixa = 12 unidades

  @@unique([fromUnitId, toUnitId])
}

model Material {
  id           String           @id @default(uuid())
  name         String
  description  String?
  sku          String?          @unique
  categoryId   String
  category     MaterialCategory @relation(fields: [categoryId], references: [id])
  unitId       String
  unit         UnitOfMeasure    @relation(fields: [unitId], references: [id])
  salePrice    Decimal?
  costPrice    Decimal?

  stocks       Stock[]
  saleItems    SaleItem[]
  purchaseItems PurchaseItem[]
}

model Stock {
  id         String   @id @default(uuid())
  materialId String
  material   Material @relation(fields: [materialId], references: [id])
  organismId String   // setor dono do estoque
  organism   Organism @relation(fields: [organismId], references: [id])
  quantity   Decimal  @default(0)

  movements  StockMovement[]

  @@unique([materialId, organismId])
  @@index([organismId])
}

model StockMovement {
  id          String        @id @default(uuid())
  stockId     String
  stock       Stock         @relation(fields: [stockId], references: [id])
  type        MovementType
  quantity    Decimal
  reason      String?
  performedBy String?       // memberId
  createdAt   DateTime      @default(now())

  @@index([stockId])
}

enum MovementType {
  IN
  OUT
  ADJUSTMENT
}

model PurchaseOrder {
  id          String         @id @default(uuid())
  organismId  String         // setor solicitante
  status      PurchaseStatus @default(DRAFT)
  requestedBy String         // memberId
  items       PurchaseItem[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

enum PurchaseStatus {
  DRAFT
  PENDING
  APPROVED
  RECEIVED
  CANCELLED
}

model PurchaseItem {
  id              String        @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  materialId      String
  material        Material      @relation(fields: [materialId], references: [id])
  quantity        Decimal
  unitPrice       Decimal?
}

// ─────────────────────────────────────────────
// MÓDULO: VENDAS
// ─────────────────────────────────────────────

model Sale {
  id            String      @id @default(uuid())
  eventId       String
  event         Event       @relation(fields: [eventId], references: [id])
  sectorEventId String
  sectorEvent   SectorEvent @relation(fields: [sectorEventId], references: [id])
  sellerId      String      // memberId do vendedor
  buyerPersonId String?     // pessoa compradora (opcional)
  total         Decimal
  status        SaleStatus  @default(OPEN)
  items         SaleItem[]
  payments      SalePayment[]
  createdAt     DateTime    @default(now())

  @@index([eventId])
  @@index([sectorEventId])
}

enum SaleStatus {
  OPEN
  PAID
  CANCELLED
  REFUNDED
}

model SaleItem {
  id         String   @id @default(uuid())
  saleId     String
  sale       Sale     @relation(fields: [saleId], references: [id])
  materialId String
  material   Material @relation(fields: [materialId], references: [id])
  quantity   Decimal
  unitPrice  Decimal
  subtotal   Decimal
}

model SalePayment {
  id        String      @id @default(uuid())
  saleId    String
  sale      Sale        @relation(fields: [saleId], references: [id])
  method    PaymentMethod
  amount    Decimal
  paidAt    DateTime    @default(now())
}

enum PaymentMethod {
  CASH
  CREDIT_CARD
  DEBIT_CARD
  PIX
  TRANSFER
}

// ─────────────────────────────────────────────
// MÓDULO: FINANCEIRO
// ─────────────────────────────────────────────

model FinanceTitle {
  id          String        @id @default(uuid())
  type        TitleType
  description String
  amount      Decimal
  dueDate     DateTime
  paidAt      DateTime?
  status      TitleStatus   @default(OPEN)
  organismId  String        // unidade fiscal responsável
  organism    Organism      @relation(fields: [organismId], references: [id])
  supplierId  String?       // personId
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([organismId])
  @@index([dueDate])
}

enum TitleType {
  PAYABLE
  RECEIVABLE
}

enum TitleStatus {
  OPEN
  PAID
  OVERDUE
  CANCELLED
}
```

---

## 6. LAZY LOAD — Configuração Prisma + NestJS

### Configuração do PrismaService

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Estratégia de Lazy Load — NUNCA use `include` por padrão

O Prisma não tem lazy load nativo como ORMs tradicionais.
A estratégia correta é **select explícito** e **never include by default**.

```typescript
// ✅ CORRETO — busca apenas o que precisa
const organism = await prisma.organism.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    path: true,
    depth: true,
    isPhysical: true,
    // ❌ NÃO inclua children, parent, members por padrão
  },
});

// ✅ Quando precisar dos filhos diretos (lazy, sob demanda)
const children = await prisma.organism.findMany({
  where: { parentId: id },
  select: { id: true, name: true, path: true, depth: true },
});

// ✅ Busca por path (evita recursão total)
// Todos os descendentes de BN.Estoril
const descendants = await prisma.organism.findMany({
  where: { path: { startsWith: 'BN.Estoril.' } },
  select: { id: true, name: true, path: true, depth: true },
  orderBy: { path: 'asc' },
});
```

### DTOs com seleção explícita por camada

```typescript
// Cada repository define seus próprios "select shapes"

export const OrganismSummarySelect = {
  id: true,
  name: true,
  path: true,
  depth: true,
  isPhysical: true,
  categoryId: true,
} as const;

export const OrganismDetailSelect = {
  ...OrganismSummarySelect,
  category: { select: { id: true, name: true } },
  address: true,
} as const;

// Uso:
const organism = await prisma.organism.findUnique({
  where: { id },
  select: OrganismDetailSelect,
});
```

---

## 7. ESTRUTURA DE MÓDULOS NEST.JS

```
src/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── modules/
│   ├── organization/
│   │   ├── organization.module.ts
│   │   ├── organization.controller.ts
│   │   ├── organization.service.ts
│   │   └── organism/
│   │       ├── organism.module.ts
│   │       ├── organism.controller.ts
│   │       ├── organism.service.ts
│   │       └── dto/
│   │
│   ├── person/
│   │   ├── person.module.ts
│   │   ├── person.controller.ts
│   │   ├── person.service.ts
│   │   ├── individual/
│   │   ├── company/
│   │   ├── address/
│   │   └── visitor/
│   │
│   ├── member/
│   │   ├── member.module.ts
│   │   ├── member.controller.ts
│   │   ├── member.service.ts
│   │   ├── member-organism.service.ts  ← gera TAGs
│   │   └── dto/
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── user.service.ts
│   │   ├── permission-group.service.ts
│   │   └── guards/
│   │
│   ├── event/
│   │   ├── event.module.ts
│   │   ├── event.controller.ts
│   │   ├── event.service.ts
│   │   ├── check-in.service.ts
│   │   └── dto/
│   │
│   ├── sector/
│   │   ├── sector.module.ts
│   │   ├── sector.service.ts
│   │   └── sector-event.service.ts
│   │
│   ├── supply/
│   │   ├── supply.module.ts
│   │   ├── material.service.ts
│   │   ├── stock.service.ts
│   │   ├── purchase-order.service.ts
│   │   └── dto/
│   │
│   ├── sales/
│   │   ├── sales.module.ts
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   └── dto/
│   │
│   └── finance/
│       ├── finance.module.ts
│       ├── finance.controller.ts
│       ├── finance.service.ts
│       └── dto/
│
└── app.module.ts
```

---

## 8. LÓGICA DE TAG AUTOMÁTICA

Quando um membro é associado a um organismo, o serviço gera a TAG pelo path:

```typescript
// member-organism.service.ts
async associateMember(memberId: string, organismId: string, role: string) {
  const organism = await this.prisma.organism.findUnique({
    where: { id: organismId },
    select: { path: true, tagTemplate: true },
  });

  // path: BN.Estoril.Staff.Levi → tag: BN:Estoril:Staff:Levi:Associado
  const tag = organism.path.replace(/\./g, ':') + ':' + role;

  await this.prisma.memberOrganism.create({
    data: { memberId, organismId, role, tag },
  });

  await this.prisma.memberTag.upsert({
    where: { memberId_tag: { memberId, tag } },
    create: { memberId, tag },
    update: {},
  });

  return { tag };
}
```

---

## 9. CONSULTAS DE DASHBOARD (via Materialized Path)

```sql
-- Total de membros por unidade
SELECT
  path,
  COUNT(mo.member_id) as total
FROM organisms o
JOIN member_organisms mo ON mo.organism_id = o.id
WHERE o.path LIKE 'BN.Estoril%'
GROUP BY o.path
ORDER BY o.path;

-- Membros sem nenhuma associação (possíveis voluntários)
SELECT p.id, ip.first_name, ip.last_name
FROM persons p
JOIN members m ON m.person_id = p.id
LEFT JOIN member_organisms mo ON mo.member_id = m.id
WHERE mo.id IS NULL;
```
