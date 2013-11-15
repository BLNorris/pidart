fclist = """26	S1
70	D1
10	T1
69	S2
53	D2
101	T2
67	S3
51	D3
83	T3
75	S4
59	D4
107	T4
40	S5
102	D5
8	T5
73	S6
57	D6
89	T6
65	S7
49	D7
81	T7
80	S8
68	D8
32	T8
35	S9
36	D9
19	T9
72	S10
56	D10
88	T10
97	S11
84	D11
17	T11
39	S12
38	D12
7	T12
74	S13
58	D13
90	T13
34	S14
100	D14
18	T14
71	S15
55	D15
87	T15
64	S16
48	D16
96	T16
85	S17
52	D17
37	T17
91	S18
54	D18
43	T18
66	S19
50	D19
82	T19
41	S20
86	D20
9	T20
6	S25
4	D25
106	S1
5	S2
99	S3
11	S4
24	S5
105	S6
33	S7
0	S8
3	S9
104	S10
1	S11
23	S12
42	S13
2	S14
103	S15
16	S16
21	S17
27	S18
98	S19
25	S20
112	XSTUCK
113	XUNSTUCK
128	BSELECT
129	BGAME
130	BSTART
131	BBOUNCE
132	BESTIMATE
133	BDOUBLE
134	BPLAYER"""

FIELDCODES = {}
for line in fclist.split("\n"):
    byte, value = line.split("\t")
    FIELDCODES[int(byte)] = value
