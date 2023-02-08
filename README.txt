1. To test the application, open the HTML file - WebJava Simulator for RISC Processor.html on browser 


Test instructions: 

1. Store, Load, Control Branch 
ADDI R0, R0, 8
ADDI R1, R1, 4
ADD R2, R0, R1
STUR R0, [R1, 20000000]
STUR R2, [R1, 20000020]
CBNZ R2, go
LDUR R3, [R1, 20000020]
SUBI R3, R3, 10
go ADD R4, R1, R2
LDUR R5, [R1, 20000020]


2. Loop (CBNZ)
MOV R2, #7
LOOP SUBI R2, R2, 1
CBNZ R2, LOOP
END MOV R3, #20


3. Loop (CMP)
MOV R0, #0
MOV R1, #4
LOOP ADDI R0, R0, 1
CMP R0, R1
BNE LOOP
END MOV R2, #1
