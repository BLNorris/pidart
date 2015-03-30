int outpin[] = {2, 3, 4, 5, 6, 7, 8, 9};
int outc = 8;
int inpin[] = {10, 11, 12, 13, 14, 15, 16, 17};
int inc = 8;
int butpin[] = {18, 19};
int butc = 2;
//int butgnd = 19;
//int ledpin = 20;
int out;
int in;
int i;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
  // set inpins/outpins
  for (i = 0; i < inc; i++) {
      pinMode(inpin[i], INPUT);
      digitalWrite(inpin[i], HIGH); // activate 20k pull-up
  }
  for (i = 0; i < outc; i++) {
      pinMode(outpin[i], OUTPUT);
      digitalWrite(outpin[i], HIGH);
  }
  // set button pins to input
  for (i = 0; i < butc; i++) {
      pinMode(butpin[i], INPUT);
      digitalWrite(butpin[i], HIGH); // activate 20k pull-up
  }
  //pinMode(butgnd, OUTPUT);
  //digitalWrite(butgnd, 0); // set gnd for buttons
  //pinMode(ledpin, OUTPUT);
  //digitalWrite(ledpin, HIGH);
}

// the loop routine runs over and over again forever:
void loop() {
  for (out = 0; out < outc; out++) {
     digitalWrite(outpin[out], LOW);
     for (in = 0; in < inc; in++) {
        if (! digitalRead(inpin[in])) {
           Serial.write((out << 4) + in);
           //digitalWrite(ledpin, LOW);
           delay(250);
           while (! digitalRead(inpin[in])) {
              Serial.write(0x70);
              delay(300);
           }
           delay(250);
           //digitalWrite(ledpin, HIGH);
        }
     }
     digitalWrite(outpin[out], HIGH);
  }  
  for (i = 0; i < butc; i++) {
    if (! digitalRead(butpin[i])) {
      Serial.write(0x80 + i);
      //digitalWrite(ledpin, LOW);
      delay(400);
      while (! digitalRead(butpin[i])) {
        Serial.write(0x70);
        delay(600);
      }
      delay(250);
      //digitalWrite(ledpin, HIGH);
    }
  }
}
