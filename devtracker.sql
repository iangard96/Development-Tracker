--
-- PostgreSQL database dump
--

\restrict WZzE8DnRpfh5cWZ7doPceUu34FWf7QzTpDxQKdrvaVfBpZRTPa0EugCtMFLxara

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-07 21:23:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 16796)
-- Name: DevTracker; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app."DevTracker" (
    id bigint NOT NULL,
    "Development Steps" text NOT NULL,
    sequence integer,
    phase integer,
    status text,
    start_date date,
    end_date date,
    duration_days integer GENERATED ALWAYS AS (
CASE
    WHEN ((start_date IS NULL) OR (end_date IS NULL)) THEN NULL::integer
    ELSE (end_date - start_date)
END) STORED,
    dev_type text,
    planned_spend numeric(12,2),
    actual_spend numeric(12,2),
    project_id integer,
    agency character varying(255),
    responsible_party character varying(255),
    responsible_individual character varying(255),
    process text,
    link text,
    requirement text,
    purpose_related_activity integer
);


ALTER TABLE app."DevTracker" OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16795)
-- Name: DevTracker_id_seq; Type: SEQUENCE; Schema: app; Owner: postgres
--

ALTER TABLE app."DevTracker" ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME app."DevTracker_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4964 (class 0 OID 16796)
-- Dependencies: 242
-- Data for Name: DevTracker; Type: TABLE DATA; Schema: app; Owner: postgres
--

COPY app."DevTracker" (id, "Development Steps", sequence, phase, status, start_date, end_date, dev_type, planned_spend, actual_spend, project_id, agency, responsible_party, responsible_individual, process, link, requirement, purpose_related_activity) FROM stdin;
45	Facility Start Study	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
46	Obtain Interconnection Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
47	Interconneciton Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
48	IX Deposit Paid	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
49	Obtain ISD Projection(+/- 90 Days)	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
50	Schedule Utility/ Pre con Meeting	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
51	Submit project to State Solar Program	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
52	Sign Program Allocation/Offtake Agreement	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
53	Assemble & Submit landuse application	\N	1	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
54	initiate site access discuss with AHJ	\N	1	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
55	FAA 7460s or Notice criteria tool	\N	1	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
56	Order Transformer	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
57	Order Modules	\N	1	\N	\N	\N	Interconnection	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
58	Geotech investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
59	ALTA Survey(includes topo)	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
60	Floodplain permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
61	Shoreland permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
62	Drain Tile investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
63	Receive Quote - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
64	Schedule Survey Date - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
65	Survey - Weather Dependent - Drain Tile	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
66	Wetland delineation	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
67	Engineer submits letter to Army Corp-Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
68	Response from Army Corp - Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
69	Pile Load Testing	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
70	Vegetative Maintence Plain	\N	2	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
71	Decommissioning Plan	\N	2	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
72	Noise Impact Asessment	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
73	Base Flood Elevation Study	\N	2	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
74	Section 404 General Permit	\N	2	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
75	Farmland Preservation Coordination	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
76	Agriculutral Impact Statement	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
77	AIMA	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
78	LESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
79	Threatended and Endangered species Analysis	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
80	Cultural Resources Concurrence	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
81	Engineer Submits Letter SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
82	Responsse from SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
83	CPCN	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
84	Phase I ESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
85	Create Decom Plan	\N	4	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
86	Approval of Landuse Permit	\N	5	\N	\N	\N	Permitting	\N	\N	14	\N	\N	\N	\N	\N	\N	\N
88	Facility Start Study	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
89	Obtain Interconnection Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
90	Interconneciton Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
91	IX Deposit Paid	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
92	Obtain ISD Projection(+/- 90 Days)	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
93	Schedule Utility/ Pre con Meeting	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
94	Submit project to State Solar Program	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
95	Sign Program Allocation/Offtake Agreement	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
96	Assemble & Submit landuse application	\N	1	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
97	initiate site access discuss with AHJ	\N	1	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
98	FAA 7460s or Notice criteria tool	\N	1	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
99	Order Transformer	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
100	Order Modules	\N	1	\N	\N	\N	Interconnection	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
101	Geotech investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
102	ALTA Survey(includes topo)	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
103	Floodplain permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
104	Shoreland permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
105	Drain Tile investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
106	Receive Quote - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
107	Schedule Survey Date - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
108	Survey - Weather Dependent - Drain Tile	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
109	Wetland delineation	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
110	Engineer submits letter to Army Corp-Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
111	Response from Army Corp - Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
112	Pile Load Testing	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
113	Vegetative Maintence Plain	\N	2	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
114	Decommissioning Plan	\N	2	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
44	Project Initiation	\N	1	\N	\N	\N	Interconnection	1000.00	20000.00	14	\N	\N	\N	\N	\N	\N	\N
40	CPCN	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
39	Responsse from SHPPO	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
38	Engineer Submits Letter SHPPO	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
37	Cultural Resources Concurrence	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
36	Threatended and Endangered species Analysis	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
35	LESA	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
34	AIMA	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
33	Agriculutral Impact Statement	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
32	Farmland Preservation Coordination	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
31	Section 404 General Permit	3	2	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
30	Base Flood Elevation Study	3	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
29	Noise Impact Asessment	3	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
43	Approval of Landuse Permit	5	5	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
42	Create Decom Plan	4	4	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
41	Phase I ESA	3	3	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
28	Decommissioning Plan	3	2	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
27	Vegetative Maintence Plain	3	2	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
26	Pile Load Testing	3	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
25	Response from Army Corp - Wetlands	3	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
24	Engineer submits letter to Army Corp-Wetlands	2	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
23	Wetland delineation	2	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
22	Survey - Weather Dependent - Drain Tile	2	2	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
21	Schedule Survey Date - Drain Tile	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
20	Receive Quote - Drain Tile	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
19	Drain Tile investigation	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
18	Shoreland permit	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
17	Floodplain permit	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
16	ALTA Survey(includes topo)	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
15	Geotech investigation	2	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
14	Order Modules	2	1	\N	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
13	Order Transformer	2	1	\N	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
12	FAA 7460s or Notice criteria tool	2	1	\N	\N	\N	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
9	Sign Program Allocation/Offtake Agreement	1	1	\N	\N	\N	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
2	Facility Start Study	1	1	Completed	2025-11-25	2025-11-28	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
1	Project Initiation	1	1	In Progress	2025-11-23	2025-11-26	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
4	Interconneciton Agreement	1	1	Completed	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
5	IX Deposit Paid	1	1	Completed	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
6	Obtain ISD Projection(+/- 90 Days)	1	1	Completed	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
7	Schedule Utility/ Pre con Meeting	1	1	Completed	\N	\N	Interconnection	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
8	Submit project to State Solar Program	1	1	Completed	2025-12-02	2025-12-05	Due Diligence	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
11	initiate site access discuss with AHJ	2	1	\N	2025-12-03	2025-12-06	Permitting	\N	\N	1	\N	\N	\N	\N	\N	\N	\N
3	Obtain Interconnection Agreement	1	1	Completed	\N	\N	Interconnection	20001.00	40000.00	1	\N	\N	\N	\N	\N	\N	\N
115	Noise Impact Asessment	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
116	Base Flood Elevation Study	\N	2	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
117	Section 404 General Permit	\N	2	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
118	Farmland Preservation Coordination	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
119	Agriculutral Impact Statement	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
120	AIMA	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
121	LESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
122	Threatended and Endangered species Analysis	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
123	Cultural Resources Concurrence	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
124	Engineer Submits Letter SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
125	Responsse from SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
126	CPCN	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
127	Phase I ESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
128	Create Decom Plan	\N	4	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
129	Approval of Landuse Permit	\N	5	\N	\N	\N	Permitting	\N	\N	13	\N	\N	\N	\N	\N	\N	\N
130	Project Initiation	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
131	Facility Start Study	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
132	Obtain Interconnection Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
133	Interconneciton Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
134	IX Deposit Paid	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
135	Obtain ISD Projection(+/- 90 Days)	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
136	Schedule Utility/ Pre con Meeting	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
137	Submit project to State Solar Program	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
138	Sign Program Allocation/Offtake Agreement	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
139	Assemble & Submit landuse application	\N	1	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
140	initiate site access discuss with AHJ	\N	1	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
141	FAA 7460s or Notice criteria tool	\N	1	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
142	Order Transformer	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
143	Order Modules	\N	1	\N	\N	\N	Interconnection	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
144	Geotech investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
145	ALTA Survey(includes topo)	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
146	Floodplain permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
147	Shoreland permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
148	Drain Tile investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
149	Receive Quote - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
150	Schedule Survey Date - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
87	Project Initiation	\N	1	\N	\N	\N	Interconnection	3.00	1.00	13	\N	\N	\N	\N	\N	\N	\N
10	Assemble & Submit landuse application	1	1	Completed	2025-11-29	2025-12-06	Permitting	5001.00	2500.00	1	\N	\N	\N	\N	\N	\N	\N
151	Survey - Weather Dependent - Drain Tile	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
152	Wetland delineation	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
153	Engineer submits letter to Army Corp-Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
154	Response from Army Corp - Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
155	Pile Load Testing	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
156	Vegetative Maintence Plain	\N	2	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
157	Decommissioning Plan	\N	2	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
158	Noise Impact Asessment	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
159	Base Flood Elevation Study	\N	2	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
160	Section 404 General Permit	\N	2	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
161	Farmland Preservation Coordination	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
162	Agriculutral Impact Statement	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
163	AIMA	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
164	LESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
165	Threatended and Endangered species Analysis	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
166	Cultural Resources Concurrence	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
167	Engineer Submits Letter SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
168	Responsse from SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
169	CPCN	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
170	Phase I ESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
171	Create Decom Plan	\N	4	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
172	Approval of Landuse Permit	\N	5	\N	\N	\N	Permitting	\N	\N	18	\N	\N	\N	\N	\N	\N	\N
179	Schedule Utility/ Pre con Meeting	\N	1	\N	\N	\N	Interconnection	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
184	FAA 7460s or Notice criteria tool	\N	1	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
185	Order Transformer	\N	1	\N	\N	\N	Interconnection	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
189	Floodplain permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
190	Shoreland permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
191	Drain Tile investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
192	Receive Quote - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
193	Schedule Survey Date - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
194	Survey - Weather Dependent - Drain Tile	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
195	Wetland delineation	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
196	Engineer submits letter to Army Corp-Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
197	Response from Army Corp - Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
198	Pile Load Testing	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
199	Vegetative Maintence Plain	\N	2	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
200	Decommissioning Plan	\N	2	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
201	Noise Impact Asessment	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
202	Base Flood Elevation Study	\N	2	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
203	Section 404 General Permit	\N	2	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
204	Farmland Preservation Coordination	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
207	LESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
208	Threatended and Endangered species Analysis	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
209	Cultural Resources Concurrence	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
210	Engineer Submits Letter SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
211	Responsse from SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
212	CPCN	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
213	Phase I ESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
214	Create Decom Plan	\N	4	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
215	Approval of Landuse Permit	\N	5	\N	\N	\N	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
174	Facility Start Study	\N	1	Completed	\N	\N	Interconnection	\N	\N	19	ComEd	3rd Party Contracted	ugu	\N	\N	\N	\N
187	Geotech investigation	\N	1	Completed	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
217	Facility Start Study	\N	1	\N	\N	\N	Interconnection	3000.00	35000.00	20	\N	\N	\N	\N	\N	\N	\N
178	Obtain ISD Projection(+/- 90 Days)	\N	1	\N	\N	\N	Interconnection	\N	\N	19	ComEd	3rd Party Contracted	\N	\N	\N	\N	\N
206	AIMA	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	State of IL	3rd Party Contracted	Bob	\N	\N	\N	\N
180	Submit project to State Solar Program	\N	1	Completed	2025-12-08	2025-12-10	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
225	Assemble & Submit landuse application	\N	1	\N	\N	\N	Permitting	500.00	250.00	20	\N	\N	\N	\N	\N	\N	\N
181	Sign Program Allocation/Offtake Agreement	\N	1	Completed	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	213
223	Submit project to State Solar Program	\N	1	\N	\N	\N	Due Diligence	4000.00	3500.00	20	\N	\N	\N	\N	\N	\N	\N
216	Project Initiation	\N	1	Completed	2025-12-16	2025-12-17	Interconnection	1000.00	2000.00	20	\N	\N	\N	\N	\N	\N	\N
182	Assemble & Submit landuse application	\N	1	\N	2025-12-16	2025-12-24	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
205	Agriculutral Impact Statement	\N	3	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
218	Obtain Interconnection Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
219	Interconneciton Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
220	IX Deposit Paid	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
221	Obtain ISD Projection(+/- 90 Days)	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
222	Schedule Utility/ Pre con Meeting	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
224	Sign Program Allocation/Offtake Agreement	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
226	initiate site access discuss with AHJ	\N	1	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
227	FAA 7460s or Notice criteria tool	\N	1	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
228	Order Transformer	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
188	ALTA Survey(includes topo)	\N	1	\N	\N	\N	Due Diligence	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
177	IX Deposit Paid	\N	1	\N	\N	\N	Interconnection	\N	\N	19	PG&E	\N	\N	\N	\N	\N	\N
183	initiate site access discuss with AHJ	\N	1	\N	2025-12-30	2026-01-01	Permitting	\N	\N	19	\N	\N	\N	\N	\N	\N	\N
175	Obtain Interconnection Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	19	Xcel	\N	\N	\N	\N	\N	\N
173	Project Initiation	\N	1	Not Applicable	2025-12-06	2025-12-07	Interconnection	9000.00	20000.00	19	Ameren	Internal	jared	\N	\N	Engineering	\N
186	Order Modules	\N	1	\N	\N	\N	Interconnection	\N	\N	19	Xcel	\N	\N	\N	\N	\N	\N
176	Interconneciton Agreement	\N	1	\N	\N	\N	Interconnection	\N	\N	19	PG&E	\N	\N	\N	\N	\N	\N
229	Order Modules	\N	1	\N	\N	\N	Interconnection	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
230	Geotech investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
231	ALTA Survey(includes topo)	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
232	Floodplain permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
233	Shoreland permit	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
234	Drain Tile investigation	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
235	Receive Quote - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
236	Schedule Survey Date - Drain Tile	\N	1	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
237	Survey - Weather Dependent - Drain Tile	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
238	Wetland delineation	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
239	Engineer submits letter to Army Corp-Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
240	Response from Army Corp - Wetlands	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
241	Pile Load Testing	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
242	Vegetative Maintence Plain	\N	2	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
243	Decommissioning Plan	\N	2	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
244	Noise Impact Asessment	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
245	Base Flood Elevation Study	\N	2	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
246	Section 404 General Permit	\N	2	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
247	Farmland Preservation Coordination	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
248	Agriculutral Impact Statement	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
249	AIMA	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
250	LESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
251	Threatended and Endangered species Analysis	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
252	Cultural Resources Concurrence	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
253	Engineer Submits Letter SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
254	Responsse from SHPPO	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
255	CPCN	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
256	Phase I ESA	\N	3	\N	\N	\N	Due Diligence	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
257	Create Decom Plan	\N	4	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
258	Approval of Landuse Permit	\N	5	\N	\N	\N	Permitting	\N	\N	20	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 241
-- Name: DevTracker_id_seq; Type: SEQUENCE SET; Schema: app; Owner: postgres
--

SELECT pg_catalog.setval('app."DevTracker_id_seq"', 258, true);


--
-- TOC entry 4815 (class 2606 OID 16805)
-- Name: DevTracker DevTracker_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app."DevTracker"
    ADD CONSTRAINT "DevTracker_pkey" PRIMARY KEY (id);


-- Completed on 2025-12-07 21:23:26

--
-- PostgreSQL database dump complete
--

\unrestrict WZzE8DnRpfh5cWZ7doPceUu34FWf7QzTpDxQKdrvaVfBpZRTPa0EugCtMFLxara

