---
title: "静态程序分析导论"
description: "静态分析的意义与健全性、完备性核心概念。"
date: 2024-09-01
lang: zh
tags:
  - Static Program Analysis
  - Introduction
---

> 中文版本正在整理中，暂时先保留原始英文笔记内容。

> 锟斤拷锟侥版本锟斤拷锟斤拷锟斤拷锟斤拷锟叫ｏ拷锟斤拷时锟饺憋拷锟斤拷原始英锟侥笔硷拷锟斤拷锟捷★拷

# Introduction

## Structure of Programming Language

### Theory

### Environment

### Application

1. **Program analysis(You are here!)**
2. Program verification
3. Program synthesis

## Why do we need program analysis?

1. Program Reliability
2. Program Security
3. Compiler Optimization
4. Program Understanding

## Static Analysis

analysis program P to reason about its behaviors and determines whether it satisfies some demands before running.

*Rice Theory: Any non-trival property of the behavior of programs in a r.e language is undecidable.*
*鎬荤殑鏉ヨ锛屼竴涓畬缇庣殑闈欐€佸垎鏋愭槸涓嶅瓨鍦ㄧ殑*

Perfect Static Analysis can not be done:Sound&Complete

=>Sound ~= overapproximate

=>Complete ~= underapproximate

p.s:*Sound鍜孋omplete浜岄€変竴锛氶€塻ound鍒欏嚭鐜癴alse positive璇姤锛岄€塩omplete鍒欏嚭鐜癴alse negative婕忔姤*

涓€鑸潵璇达紝鎴戜滑鏇村€惧悜soundness

### Necessity of Soundness

Soundness is critical in compiler optimization and program verification