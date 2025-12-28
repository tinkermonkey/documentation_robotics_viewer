# Public Datasets for Layout Testing

This directory contains test datasets for validating and optimizing layer-specific graph layouts in the Documentation Robotics Viewer. Each dataset represents a realistic, production-quality example of that layer's domain.

## Dataset Categories

### 1. Motivation Layer
**Use Case:** Enterprise goal hierarchies and stakeholder influence networks

**Dataset: Enterprise Digital Transformation Goals**
- **Source:** Inspired by common digital transformation frameworks (McKinsey, Gartner)
- **Structure:** Multi-level goal hierarchy with stakeholder relationships
- **Elements:**
  - 1 Vision statement
  - 4 Strategic goals (business, technology, operational, cultural)
  - 12 Tactical objectives
  - 8 Key stakeholders with influence relationships
  - 6 Constraints
- **License:** Public domain (derived from publicly available frameworks)
- **Expected Layout:** Hierarchical tree with radial stakeholder distribution
- **Quality Metrics:**
  - Clear hierarchical levels (vision -> strategic -> tactical)
  - Stakeholders distributed around influenced goals
  - Minimal edge crossings in goal tree

### 2. Business Layer
**Use Case:** BPMN-style business process flows

**Dataset: E-Commerce Order Fulfillment Process**
- **Source:** Based on standard BPMN 2.0 e-commerce patterns
- **Structure:** Multi-lane process with decision gateways
- **Elements:**
  - 3 Swimlanes (Customer, Sales, Warehouse)
  - 15 Activities (tasks and subprocesses)
  - 4 Gateways (exclusive, parallel)
  - 2 Events (start, end)
  - 18 Sequence flows
- **License:** Public domain (standard business process pattern)
- **Expected Layout:** Left-to-right flow with orthogonal edges
- **Quality Metrics:**
  - Clear left-to-right progression
  - Swimlanes horizontally separated
  - Orthogonal edge routing (right angles)
  - Gateway branches clearly visible

### 3. C4 Architecture Layer
**Use Case:** Microservices system architecture

**Dataset: Cloud-Native SaaS Platform**
- **Source:** Inspired by C4 model examples (https://c4model.com)
- **Structure:** System context and container diagrams
- **Elements:**
  - 1 Core system (SaaS Platform)
  - 6 Containers (Web UI, API Gateway, Services, Databases, Queue)
  - 4 External systems (Auth, Payment, Email, Analytics)
  - 15 Relationships
- **License:** Public domain (based on C4 model examples)
- **Expected Layout:** Hierarchical with boundary grouping
- **Quality Metrics:**
  - Internal containers clustered together
  - External systems visually separated
  - Clear system boundaries
  - Hierarchical service dependencies

### 4. Security Layer
**Use Case:** Role-based access control model

**Dataset: Multi-Tenant Application Security**
- **Source:** Synthetic, based on common RBAC patterns
- **Structure:** Roles, permissions, resources, and policies
- **Elements:**
  - 5 Roles (Admin, Manager, User, Guest, Service)
  - 12 Permissions (create, read, update, delete across resources)
  - 8 Secure resources (user data, financial data, etc.)
  - 10 Policy rules
  - 4 Threats with countermeasures
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Hierarchical role inheritance with permission relationships

### 5. Application Layer
**Use Case:** Layered application architecture

**Dataset: Three-Tier Web Application**
- **Source:** Synthetic, based on standard architecture patterns
- **Structure:** Presentation, business logic, data access layers
- **Elements:**
  - 6 Presentation components (UI, controllers)
  - 8 Business services (domain logic)
  - 4 Data access components (repositories, ORMs)
  - 15 Component relationships
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Horizontal layering with top-down flow

### 6. Technology Layer
**Use Case:** Technology stack and infrastructure

**Dataset: Modern Cloud Infrastructure**
- **Source:** Synthetic, based on AWS/Azure common patterns
- **Structure:** Infrastructure components and dependencies
- **Elements:**
  - 12 Infrastructure components (load balancer, compute, storage, cache, queue, etc.)
  - 8 Technology dependencies
  - 3 Deployment environments (dev, staging, production)
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Hierarchical infrastructure layers

### 7. API Layer
**Use Case:** RESTful API structure

**Dataset: RESTful API for E-Commerce**
- **Source:** Synthetic, based on OpenAPI/Swagger patterns
- **Structure:** API endpoints, operations, and data flow
- **Elements:**
  - 4 API interfaces (Products, Orders, Users, Payments)
  - 16 Endpoints (GET, POST, PUT, DELETE operations)
  - 20 Operation dependencies
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Hierarchical endpoint grouping

### 8. Data Model Layer
**Use Case:** Entity-relationship diagram

**Dataset: E-Commerce Data Model**
- **Source:** Synthetic, based on standard e-commerce schemas
- **Structure:** Entities with relationships and attributes
- **Elements:**
  - 10 Entities (User, Product, Order, Payment, etc.)
  - 25 Attributes
  - 15 Relationships (one-to-many, many-to-many)
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Entity-relationship layout minimizing edge crossings

### 9. Datastore Layer
**Use Case:** Database and storage architecture

**Dataset: Polyglot Persistence Architecture**
- **Source:** Synthetic, based on modern data storage patterns
- **Structure:** Multiple database types and data flows
- **Elements:**
  - 8 Datastores (PostgreSQL, Redis, MongoDB, S3, etc.)
  - 12 Data flow relationships
  - 4 Data pipelines
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Hierarchical data flow

### 10. UX Layer
**Use Case:** User interface component hierarchy

**Dataset: Admin Dashboard UI Structure**
- **Source:** Synthetic, based on common dashboard patterns
- **Structure:** Screens, components, and interaction flows
- **Elements:**
  - 8 Screens (Dashboard, Users, Products, Orders, etc.)
  - 24 UI components (tables, forms, charts, buttons)
  - 20 Component relationships
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Screen-based grouping with component hierarchy

### 11. Navigation Layer
**Use Case:** Application navigation structure

**Dataset: Multi-Level Application Menu**
- **Source:** Synthetic, based on standard navigation patterns
- **Structure:** Hierarchical menu with routes and breadcrumbs
- **Elements:**
  - 12 Routes (pages/views)
  - 3 Menus (main nav, user menu, footer)
  - 8 Breadcrumb trails
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Hierarchical navigation tree

### 12. APM Layer
**Use Case:** Application performance monitoring metrics

**Dataset: Service Health Monitoring**
- **Source:** Synthetic, based on common APM tools (DataDog, New Relic patterns)
- **Structure:** Metrics, monitors, and alert flows
- **Elements:**
  - 15 Metrics (latency, error rate, throughput, etc.)
  - 8 Monitors/Alerts
  - 6 Dashboards
  - 10 Metric dependencies
- **License:** Public domain (synthetic dataset)
- **Expected Layout:** Metric hierarchy with alert relationships

## Usage

Each dataset is stored in its respective subdirectory in DR YAML format:
- `motivation/` - Goal hierarchy dataset
- `business/` - Business process dataset
- `c4/` - C4 architecture dataset
- `security/` - Security model dataset
- `application/` - Application architecture dataset
- `technology/` - Technology stack dataset
- `api/` - API structure dataset
- `datamodel/` - Data model dataset
- `datastore/` - Datastore architecture dataset
- `ux/` - UX component hierarchy dataset
- `navigation/` - Navigation structure dataset
- `apm/` - APM metrics dataset

## Testing Guidelines

1. **Load Dataset:** Use the DR YAML parser to load the dataset
2. **Transform to Graph:** Use layer-specific transformer to convert to React Flow nodes/edges
3. **Apply Layout:** Use optimized layout engine for that layer
4. **Measure Quality:** Calculate quality metrics (edge crossings, alignment, etc.)
5. **Visual Inspection:** Generate layout visualization for manual review

## Quality Baselines

Each dataset includes expected quality characteristics:
- **Motivation:** Hierarchical clarity > 0.8, radial symmetry
- **Business:** Left-right progression, orthogonal edges, low crossings
- **C4:** System boundary grouping, external system separation
- **Security:** Role hierarchy clarity, permission clustering
- **Application:** Layer separation, top-down flow
- **Technology:** Infrastructure stack visibility
- **API:** Endpoint grouping by interface
- **Data Model:** Minimal edge crossings, entity clustering
- **Datastore:** Data flow clarity
- **UX:** Screen-based grouping
- **Navigation:** Navigation tree structure
- **APM:** Metric hierarchy with alert relationships

## References

- C4 Model: https://c4model.com
- BPMN 2.0: https://www.omg.org/spec/BPMN/2.0/
- ArchiMate Motivation Extension: https://pubs.opengroup.org/architecture/archimate3-doc/
- OpenAPI Specification: https://swagger.io/specification/
- Common enterprise architecture patterns and frameworks

## Maintenance

Datasets should be reviewed and updated annually to reflect:
- Changes in industry best practices
- New architectural patterns
- User feedback on layout quality
- Evolution of DR model schema
