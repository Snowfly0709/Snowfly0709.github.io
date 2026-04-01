---
title: "Dataflow Analysis Notes"
description: "A compact walkthrough of dataflow analysis concepts and practical rules."
date: 2024-10-01
lang: en
tags:
  - Static Program Analysis
  - Dataflow Analysis
  - Compiler
---

# Intermediate_representation涓棿璇█琛ㄧず

## Review of Compiler

Source code -> 璇嶆硶鍒嗘瀽 -> 璇硶鍒嗘瀽 -> 璇箟鍒嗘瀽 -> 涓棿浠ｇ爜鐢熸垚 -> **锛堥潤鎬佸垎鏋愶級** -> 鐢熸垚鐩爣浠ｇ爜 -> machine code
    
鏇村鏈夊叧缂栬瘧鍘熺悊鐨勫唴瀹硅鏌ラ槄鍏朵粬涔︾睄鎴栬烦杞垜鐨勪笓鏍忥細

### AST鎶借薄璇硶鏍戜笌涓夊湴鍧€鐮佹瘮锟?
#### AST

1. high-level & close to grammar
2. language dependent
3. fast type checking
4. lack of control-flow information

#### IR(3-address)

1. low-level & close to machine code
2. language independent
3. simple, compact and uniform
4. contain control-flow information

## Soot and Jimple

Soot鏄痝ithub涓婁竴涓紑婧愮殑java闈欐€佸垎鏋愰」鐩紝瀹冪殑IR鍚嶅瓧鍙獼imple

e.g.1 for寰幆

```bash
package xjtu.edu.e1;
public class ForLoop3AC {
    public static void main(String[] args){
        int x = 0;
        for(int i = 0; i < 10; i++){
            x = x + 1;
        }
    }
}

#瀵瑰簲鐨凧imple锟?public static void main(java.lang.String[]){
    java.lang.String[] r0;
    int i1;

    r0 := @parameter0: java.lang.String[];
    i1=0; #杩欓噷缂栬瘧鍣ㄨ繘琛屼簡浼樺寲锛寈 dead-zone

    label1:
        if i1 >= 10 goto label2; #鏈夋潯浠秅oto璇彞

        i1 = i1 + 1;

        goto label1; #鏃犳潯浠秅oto璇彞

    label2:
        return;
}
```

e.g.2 鏂规硶璋冪敤

```bash
package example;
public class MethodCall3AC{
    String combine(String string1, String string2){
        return string1 + " " + string2;
    }

    public static void main(String[] args){
        MethodCall3AC mc = new MethodCall3AC();
        System.out.println(mc.combine("xjtu","se"))
    }
}

#combine鍑芥暟瀵瑰簲鐨凧imple锟?java.lang.String combine(java.lang.String, java.lang.String){
    example.MethodCall3AC r0;
    java.lang.String r1,r2,$r7; #$鍦↗imple涓唬琛ㄤ复鏃跺彉锟?    java.lang.StringBuilder $r3,$r4,$r5,$r6;

    r0 := @this: example.MethodCall3AC;
    r1 := @parameter0: java.lang.String;
    r2 := @parameter1: java.lang.String;
    $r3 = java.lang.StringBuilder;

    specialinvoke $r3.<java.lang.StringBuilder: void <init>()>();
    #鍑芥暟绛惧悕 className.<classType: returnType methodName(paraType)>(paraName)

    $r4 = virtualinvoke $r3.<java.lang.StringBuilder: java.lang.StringBuilder append(java.lang.String)>(r1);
    #杩欎竴姝ョ浉褰撲簬浣跨敤浜哠tringBuilder搴曚笅鐨刟ppend鏂规硶锛屽湪绌虹殑鍩虹涓婅鎺ヤ簡瀹為檯鍊间负r1鐨凷tringBuilder浣滀负杩斿洖鍊硷紝涓嬪悓
    $r5 = virtualinvoke $r4.<java.lang.StringBuilder: java.lang.StringBuilder append(java.lang.String)>(" ");
    $r6 = virtualinvoke $r5.<java.lang.StringBuilder: java.lang.StringBuilder append(java.lang.String)>(r2);

    $r7 = virtualinvoke $r6.<java.lang.StringBuilder: java.lang.String toString()>();
    return $r7;
}

#main鍑芥暟瀵瑰簲鐨凧imple锟?public static void main(java.lang.String[]){
    java.lang.String[] r0;
    example.MethodCall3AC $r3; #鐢变簬combine鍑芥暟鍜宮ain鍑芥暟涓€璧疯繘琛孲oot杞崲锛宺1鍜宺2宸茬粡浣跨敤锛宺3浣滀负涓存椂鍙橀噺琚噴锟?    java.lang.System $r4;
    java.io.printStream $r5;

    r0 := @parameter0: java.lang.String[];
    $r3 = new example.MethodCall3AC;
    $r4 = java.lang.System;

    specialinvoke $r3.<example.MethodCall3AC: void <init>()>();

    virtualinvoke $r3.<example.MethodCall3AC: java.lang.String combine(java.lang.String, java.lang.String
    )>("xjtu","se");

    $r5 = finalinvoke $r4.<java.lang.System: java.io.printStream out()>();
    #$r4鍗充负java.lang.System锛宱ut鏄疭ystem涓殑final鏂规硶

    virtualinvoke $r5.<java.io.printStream: java.lang.String println(java.io.printString)>($r3);
    return;
}
```

e.g.3 绫诲０鏄庝笌浣跨敤

```bash
package example;
public class class3AC{
    public static final double pi = 3.14;
    public static void main(String[] args){
    
    }
}

Jimple:
public class example.class3AC extends java.lang.object{
    public static final double pi;

    public void <init>(){
        example.class3AC r0;

        r0 := @this: example.class3AC;

        specialinvoke r0.<java.lang.Object void <init>()>();

        return;
    }

    public static void main(java.lang.String[]){
        java.lang.String[] r0;

        r0 := @parameter: java.lang.String[];

        return;
    }

    public static void<clinit>(){
        <example.class3AC: double pi> = 3.14;

        return;
    }
}
```

### 鍏充簬jvm瀛楄妭鐮佷腑璋冪敤鐨勫洓绉嶇被锟?
1. invokespecial: call constructor/superclass/private鏈濈埗绾ц皟锟?2. invokevirtual: instance method call(virtual)鏈濆瓙绾ц皟锟?3. invokeinterface: checking interface implementation
4. invokestatic: call static methods

## Static Single Assignment(SSA)

each variables in assignment have a distinct name

```bash
3AC:
p = a + b
q = p - c
p = q * e
p = p * c

SSA:
p1 = a + b
q1 = p1 - c
p2 = q1 * e1
p3 = p2 * c
```

瀵逛簬澶氭潯鏁版嵁娴佸瓨鍦╬hi-function锛岀粰涓嶅悓鏁版嵁娴佺殑鍚屼竴涓彉閲忚繘琛岄€夋嫨锛屽悓鏃惰祴缁欐柊鍚屽悕鍙橀噺锛屽啀杩涜鍏朵粬鍙橀噺鐨勫畾锟?
SSA may introduce too much phi-function

## Control Flow Graph鎺у埗娴佸浘

### Basic Block

1. contains 3 addr code
2. can only be entered in the first line
3. only have one exit(do not have exit except last line)

```bash
BB1:
(1)a = input
(2)b = a + 2

BB2:
(3)c = a * b
(4)if c > 20 goto (7)

BB3:
(5)b = b + 1
(6)goto (3)

BB4:
(7)d = b / a
(8)p = b - d
(9)if d==p goto (11)

BB5:
(10) goto(3)

BB6:
(11) return
```

鎬荤殑鏉ヨ锛孊B鐨勯琛屽垽鏂柟娉曚负锟?
锟?锛夋暣娈典唬鐮佺殑绗竴锟?
锟?锛夎烦杞殑鐩爣锟?
锟?锛夎烦杞鐨勪笅涓€锟?
### Flow鐨勫缓锟?
1. 鎵€鏈塀B榛樿璺宠浆鍒颁笅涓€BB锛岄櫎浜唀xit涓虹函goto
2. 甯︽湁goto鎸囦护鐨勮繕闇€璺宠浆鍒板搴旂殑BB

```text
        2 <------ 5
        2 <- 3
1 -> 2 -> 3
        -> 4 -> 5
            -> 6
```