import java.applet.Applet;
import java.awt.*;
import java.math.BigInteger;

public class BigIntApplet extends Applet {

    @Override
    public void init() {
        add(new Label("Java BigInt Applet"));
    }

    public String add(String val1, String val2) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        return i1.add(i2).toString(10);
    }

    public String substract(String val1, String val2) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        return i1.subtract(i2).toString(10);
    }

    public String multiply(String val1, String val2) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        return i1.multiply(i2).toString(10);
    }

    public String divide(String val1, String val2) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        return i1.divideAndRemainder(i2)[0].toString(10);
    }

    public String mod(String val1, String val2) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        return i1.mod(i2).toString(10);
    }

    public String modPow(String val1, String val2, String val3) {
        BigInteger i1 = new BigInteger(val1, 10);
        BigInteger i2 = new BigInteger(val2, 10);
        BigInteger i3 = new BigInteger(val3, 10);
        return i1.modPow(i2, i3).toString(10);
    }

    public boolean isProbablePrime(String val) {
        BigInteger i = new BigInteger(val, 10);
        return i.isProbablePrime(80);
    }
}
