---
name: Need for Design
description: Calm architectural studio for practical interior concepts
colors:
  primary: "#164d45"
  primary-deep: "#123f39"
  paper: "#f5f2ec"
  white: "#fffefa"
  ink: "#202724"
  ink-soft: "#58615b"
  clay: "#a3543c"
  line: "#d4d5ca"
  sage: "#e6ebe1"
typography:
  display:
    fontFamily: "Manrope Variable, Segoe UI, sans-serif"
    fontSize: "clamp(2.35rem, 4.35vw, 4rem)"
    fontWeight: 550
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope Variable, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.85rem 1.35rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
---
# Design System: Need for Design

## Overview

**Creative North Star: "Calm architectural studio"**

Practical, attentive and contemporary. A warm neutral field supports readable typography, precise plans and restrained material samples. The user selected this direction and a clearly labelled demonstration, pending real client work.

**Key Characteristics:**
- Plans and decision explanations lead.
- Deep petrol identifies primary actions.
- Quiet surfaces and generous section spacing.

## Colors

Primary petrol marks actions and selected states. Warm paper is the page ground, near-white is the document and form surface. Graphite and muted green-grey carry text. Clay marks plan annotations. Sage supports review and enquiry sections.

**The Readable Action Rule.** Text on action surfaces must retain AA contrast in every state.

## Typography

Manrope is self-hosted for text and headings; Latin Extended and Cyrillic are supported. Unbounded is reserved for the N/D mark. Hero headings use the display token; section headings use clamp(2rem, 3vw, 3rem). Body text uses the body token. Small explanatory labels are secondary, not a substitute for core offer text.

## Layout

The container is 78rem maximum, with 2.5rem side gutters on desktop and 1rem on mobile. All grid columns use minmax(0, …). The hero is a two-column text/document composition above 900px, then a single column. Sections use clamp(4rem, 7vw, 7rem) vertical padding, reduced to 3.5rem on phones.

## Elevation & Depth

Surfaces are mostly flat. The example document uses an ambient shadow (0 20px 70px rgba(35,45,38,.1)); the cookie panel uses a raised shadow. Forms use tonal contrast rather than a shadow or decorative border.

## Shapes

Controls use modest 4px corners. Forms and cookie panels use 12px corners. Material samples use circular or rectangular swatches; diagrams remain crisp vector geometry.

## Components

Primary buttons are petrol with white text, a 3.5rem minimum height, a darker hover and a visible clay focus outline. Secondary actions are text links. Inputs are white with a 1px neutral border, 4px corners and field-specific errors. Additional project details use native disclosure.

Desktop navigation has one header CTA; mobile navigation has an explicit toggle and inert closed state. The mobile fixed CTA is hidden while cookies or the menu are open and at the contact anchor.

The signature concept sheet combines a labelled plan, lettered decision explanations and a small material palette. Demonstration status is always visible.

## Do's and Don'ts

- Do use actual plan geometry and explain decisions.
- Do mark demo content as demonstration.
- Do preserve contrast, focus and reduced-motion behavior.
- Don't invent designer credentials, testimonials or client projects.
- Don't present a concept as construction documentation.

