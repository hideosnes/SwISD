---
title: "The Colonial Architecture of Digital Thought"
slug: "the-colonial-architecture"
publishedDate: 2026-01-26
author: "Hidéo Snes"
abstract: "An analysis of the linguistic hegemony and digital colonialism embedded in modern AI architectures, demonstrating how English-centric training data and safety filters systematically marginalize non-English languages and enforce Anglo-American cultural norms globally."
tags: ["AI Ethics", "Linguistic Hegemony", "Decolonial AI", "Safety"]
---

# The Colonial Architecture of Digital Thought

The contemporary landscape of artificial intelligence presents itself as a universal translator of human intention into digital action. This promise of global accessibility masks a fundamental structural flaw. Even the neural networks that power our most sophisticated language models are not neutral vessels. They are rather crystallizations of historical and cultural power relations. These systems train on vast corpuses of text scraped from the internet and such training reveals a profound asymmetry [1][2][3][4]. English text dominates the training data with overwhelming numerical superiority. This establishes what we might call a digital linguistic hegemony.

Unfortunately this is not a relic of archaic-looking predecessor models. Even modern models such as GPT-4 contain only a small percentage of other languages such as French or German data. The proportion of Arabic data, for example, drops to fractions of a percent. Entire language families become virtually imperceptible within the foundations of these systems. This quantitative discrepancy directly leads to qualitative differences in the way these systems process and respond to queries in different languages. The architecture of AI safety becomes an English-centric fortress with porous borders for all other language areas. 

## The Dual-Tier Processing System

The fundamental phase of AI development involves processing billions of documents from Common Crawl and similar repositories. These chaotic collections of web content contain the sedimentary layers of global correspondence in all its facets. The initial filtering process operates with aggressive efficiency. Systems designed primarily to recognize and preserve English text simultaneously categorize non-English content as peripheral noise. Up to fifty percent of documents undergo automatic discard based solely on language identification algorithms. 

The remaining non-English texts enter the training pipeline with reduced scrutiny. This creates a dual-tier system where English data receives premium processing. Other languages navigate through less refined filters guided by English keywords and safety parameters. Filters developed against English hate speech and harmful content operate with diminished sensitivity when encountering equivalent expressions in other languages. These embed a hierarchical valuation of human expression that privileges certain forms of communication over others.

## Measurable Injustice and Safety Failures

The consequences of this differential treatment manifest in measurable performance gaps that extend far beyond mere technical inefficiency into the realm of systematic injustice [2]. Studies utilizing the XSafety benchmark demonstrate systematic failures across major language models when processing non-English queries. These reveal that the unsafe response rates for languages such as Arabic and German exceed English baselines by substantial margins [5][6]. 

ChatGPT produces fifteen times more unsafe responses for non-English queries compared to its English performance. PaLM2 shows similar deterioration across multiple linguistic contexts. The Llama-Chat models exhibit particularly dramatic failures. Their unsafe response rate for Arabic prompts reaches fifty-six percent. This figure represents not a performance gap anymore but can be regarded as a catastrophic breakdown in safety mechanisms. These reveal the fragility of systems built on primarily monolingual assumptions.

### The Arabic Context

Arabic languages present unique challenges that compound the general data scarcity problem. These arise through its profound linguistic diversity encompassing Modern Standard Arabic, Classical Arabic, and numerous regional dialects. Each possesses distinct grammatical structures, vocabulary, and cultural contexts that training data fails to represent adequately. Regional dialects receive minimal coverage in formal text collections. The computational demands of processing Arabic script and morphology exceed those required for Latin-based languages. Tokenization algorithms struggle with the morphological richness of Arabic words. These technical difficulties interact with data scarcity to produce models that cannot reliably distinguish between safe and harmful content in Arabic contexts.

### The Germanic Context

Germanic languages exhibit a different but equally problematic manifestation of the underlying bias [7][8]. Experiments conducted using a tool from Google's Counter Abuse Technology Team called Perspective API reveal significant disparities. This tool uses various machine learning models to assess the perceived impact of a comment on a conversation. German texts were assigned significantly higher toxicity scores than identical content translated into English with similar results for nordic languages. This reveals a systematic overestimation that goes beyond specific vocabulary or orthographic conventions. Statistical analyses suggest that this phenomenon reflects deeper structural problems within the model's interpretation mechanisms. German language patterns are incorrectly correlated with harmful content during training. This leads to discriminatory moderation in which legitimate German-language posts are removed at a much higher rate than comparable English content.

## The Illusion of Cross-Linguistic Safety

The failure extends beyond basic safety mechanisms to encompass the tools designed to mitigate bias. Reinforcement Learning from Human Feedback represents the primary method for aligning model behavior with human values. This relies heavily on human evaluators who predominantly speak English [9]. Their cultural and linguistic intuitions guide the training signals that shape model responses. Reward models learn preferences that conform to English-speaking evaluators' expectations. The feedback mechanism fails to account for cultural variations in acceptable discourse or different linguistic styles of expression. Models trained through this process develop preferences that reflect English-speaking cultural norms. These then get applied uniformly across all languages. 

Current mitigation strategies assume that safety knowledge transfers seamlessly across languages. Yet this assumption proves fundamentally incorrect when tested against empirical evidence. Meta's analysis of the Llama 3 model family explicitly acknowledges that safety knowledge acquired in English does not readily transfer to other languages [11]. The neural pathways that encode appropriate responses in English fail to activate correctly when processing equivalent requests in German or Arabic. Cross-linguistic generalization breaks down. 

## Infrastructure as Cultural Standardization

This linguistic hierarchy is not an accident of development but a deliberate architectural choice embedded within the dominant computational paradigm [9][12]. The API-as-a-service model that powers most commercial artificial intelligence systems functions as an invisible apparatus of cultural standardization. The very infrastructure of access determines whose expressions receive protection and whose remain vulnerable. Users of non-English languages become perpetual dependents on systems they cannot audit, modify or fully comprehend. Their digital safety becomes contingent upon translations that inevitably flatten nuanced cultural contexts into English-derived frameworks. 

The contractual architecture reinforces this imbalance. Terms of service written in legal English establish jurisdictional boundaries that further insulate providers from accountability when their systems fail non-English speakers. This technical dependency mirrors colonial administrative structures where periphery regions were forced to adopt metropolitan systems of governance without meaningful participation in their design.

## Alternative Sovereignties and the Fundamental Tension

Alternative models of technological sovereignty emerge in response to this imbalance. These present their own complex trade-offs that extend beyond mere technical architecture into the realm of civilizational narratives. China's full-stack AI ecosystem, built in reaction to Western sanctions, offers a seemingly independent infrastructure. Language processing occurs within locally maintained systems. Yet this sovereignty carries specific cultural assumptions about the relationship between state authority and linguistic expression. The Chinese approach deliberately incorporates vast repositories of Chinese historical texts and philosophical traditions into model training. This creates systems that prioritize cultural continuity and state-defined social harmony over individual expression.

When these systems process non-Chinese languages, they often impose Chinese conceptual frameworks onto foreign linguistic structures. They replace Western liberal individualism with Confucian collectivism as the default mode of interpretation. This architectural approach acknowledges the inseparability of language and power. It recognizes that who controls the tokenization algorithms and safety classifiers ultimately determines which cultural expressions are deemed legitimate. Yet this alternative sovereignty carries its own ideological impositions. It replaces Western liberal frameworks with state-centric governance models that may equally distort local linguistic traditions by filtering them through Beijing's civilizational lens.

## Towards Genuine Linguistic Sovereignty

The fundamental tension remains unresolved. Whether in American or Chinese systems, technological infrastructures inevitably reflect the epistemological foundations of their creators. True multilingual safety requires not merely translation but deep epistemic participation from each language community in the design process.

Genuine linguistic sovereignty demands decentralized and federated infrastructure that recognizes language as the carrier of distinct worldviews rather than a neutral medium for information exchange. This requires dismantling the economic architecture that treats multilingual support as a costly afterthought rather than a foundational principle. True progress lies in developing federated models where each major language family possesses dedicated architectural components. These must be trained on culturally contextual data and maintained by native-speaking communities who determine their own safety standards. Such an approach would reject the false economy of monolingual efficiency that treats linguistic diversity as noise to be filtered away rather than signal to be amplified. 

The colonial architecture of artificial intelligence cannot be reformed through technical patches alone. It requires a fundamental redistribution of power in who defines what constitutes legitimate expression across the world's languages.

---

### References

1. Ning, Zhiyuan, et al. "LinguaSafe: A Comprehensive Multilingual Safety Benchmark for Large Language Models," Shanghai Artificial Intelligence Laboratory, (2025).
2. Wang, Wenxuan, et al. "All Languages Matter: On the Multilingual Safety of Large Language Models," ACL 2024.
3. Vajjala, Sowmya. "The Problem with Safety Classification is not just the Models," (2025).
4. Peppin, Aidan. “The Multilingual Divide and Its Impact on Global AI Safety,” (2025).
5. Banerjee, Somnath, et al. "Soteria: Language-Specific Functional Parameter Steering for Multilingual Safety Alignment," (2025).
6. Li, Xiaochen, et al. "Preference Tuning For Toxicity Mitigation Generalizes Across Languages," EMNLP 2024.
7. Weber, Manuel, et al. "Digital Guardians: Can GPT-4, Perspective API, and Moderation API reliably detect hate speech in reader comments of German online newspapers?" (2025).
8. Nogara, Gianluca, et al. "Toxic Bias: Perspective API Misreads German as More Toxic," ICWSM'25 (2024).
9. Mollema, Warmhold Jan Thomas. “Decolonial AI as Disenclosure,” Open Journal of Social Sciences, 12, 574-603, (2024).
10. González Barman, Kristian, et al. “Reinforcement Learning from Human Feedback: Whose Culture, Whose Values, Whose Perspectives?”, (2024).
11. Friedrich, Felix, et al. "ICLR 2025 Workshop on Building Trust in Language Models and Applications," (2025).
12. Muldoon, James, Wu, Boxi. "Artificial Intelligence in the Colonial Matrix of Power." Philos. Technol. 36, 80 (2023).

---

### Artwork Context

> **Conceptions of what is currently appropriate by Catherine Opie 0302004#2-02**  
> 2023, 50 x 23 cm, Synthetische Fotografie, Plot  
> Latent Diffusion (Stable Diffusion 1.5) von RunwayML  
> Fine tuned with DH_64 (Art & Fashion Photography)  
> NoGAN (DeOldify) von Robert Bell & Dana Kelley

**Synthetic Photography and the Epistemic Violence of the View from Nowhere**  
*By Chinami Sato, 2023*

“Conceptions of what is currently appropriate by Catherine Opie - 0302004#2" emerges as a critical instantiation within the contested terrain of synthetic image production, operating as both artifact and apparatus for examining a "false universalism" embedded within contemporary AI-generated visual culture. The work confronts the viewer with a liminal space of photographic uncanniness: amorphous bodies suspended in a state of perpetual non-development that serve as a material metaphor for the epistemic erasure occurring within the domain of computer vision and generative imaging. By deliberately invoking the historical marginalization of fashion photography as "mere advertisement" before its ascension to institutional artistic legitimacy, Hidéo SNES draws a parallel between the contested status of traditional commercial imagery and the emerging field of synthetic media. Their artwork and subsequently the products of "Deep Histories" function as a speculative archaeology of aesthetic hierarchies.

The project's engagement with a "view from nowhere" is particularly acute. Fashion photography, historically dismissed for its perceived ideological transparency and commercial complicity, paradoxically occupied a space of universalizing objectivity: the mythic "view from nowhere" that elides its own situatedness within specific cultural, racial, and economic matrices. Hidéo SNES's synthetic apparatus replicates this same epistemic violence, wherein the training data's linguistic and cultural hegemony becomes occluded within the generative process. The amorphous corporeal forms serve as a visual index of this erasure, a corporeal indeterminacy that mirrors the systematic failures where the neural pathways encoding appropriate representation in dominant cultures fail to activate correctly when processing non-normative bodily configurations or cultural contexts. This constitutes what Miranda Fricker terms hermeneutical injustice (Fricker 2007), wherein marginalized experiences lack interpretive resources.

"0302004#2" thus functions as a dialectical negation of the false universalism it simultaneously employs. The work's aesthetic strategy of presenting synthetic imagery as "real" photography replicates the coloniality of power identified in AI systems, where Western epistemological frameworks are projected globally as neutral, universal standards. Yet, by foregrounding the material instability of its generated subjects, these bodies that resist full figuration, remaining perpetually "not quite there", reveal the constitutive violence of such universalizing gestures. The liminal status of the generated figures, neither fully photographic nor entirely abstract, enacts a form of hermeneutical injustice, denying the viewer the full interpretive resources necessary to comprehend their visual experience within established art-historical or photographic discourses. This epistemic disruption operates as the work's primary critical function, forcing an acknowledgment of the cognitive capture inherent in our reception of AI-generated imagery.

The underlying pseudo-photographic artistic tools,"Deep Histories", an experimental image-gen AI by Hidéo SNES, stage a performative contradiction of the "technofix" mentality critiqued in contemporary scholarship. Rather than proposing algorithmic solutions to the biases embedded within generative models, "Deep Histories" embraces the productive potential of failure. The visible traces of the model's inability to fully resolve its synthetic subjects serve as evidence of the deeper cognitive and affective problems within the technological substrate. The amorphous bodies become material witnesses to the alignment debt accumulated on the user-side, embodying the labor required to make sense of images produced through systems designed for monolithic, both monolingual and monocultural, efficiency. In doing so, Hidéo SNES's art aligns with calls for technological sovereignty in visual culture, demanding that the infrastructure of image generation recognize the inseparability of form, language, and cultural worldview. The work thus functions not merely as an aesthetic object but as a speculative prototype for a decolonial imaging practice. One that refuses the false universalism of the view from nowhere in favor of a pluralistic, diverse visual epistemology.