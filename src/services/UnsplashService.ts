/**
 * Goal: to find relevant photos for each product based on the product's category from Unsplash API'
 * How many photos to fetch: Default 4
 * Regular photo size will be used
 * If Rate Limit is reached, wait and retry
 * Number of retries: 3 default (can be configured in the env file)
 * Time between retries: 500ms (can be configured in the env file)
 * If error occurs during the process, a structured log will be created
 * mappings :
 * t-shirts -> "t-shirt apparel studio white background"
 * hoodies -> "hoodie fashion studio isolated background"
 * sweaters -> "sweater knitwear studio fashion shot"
 * denim -> "denim jeans fashion studio isolated"
 * chinos -> "chino pants fashion studio neutral background"
 * dresses -> "dress fashion studio editorial isolated"
 * skirts -> "skirt fashion studio minimal background"
 * blouses -> "blouse fashion photo studio clean background"
 * shirts -> "shirt menswear studio white background"
 * suits -> "suit menswear studio portrait isolated"
 * jackets -> "jacket fashion studio outerwear isolated"
 * coats -> "coat fashion editorial studio white wall"
 * activewear -> "activewear sportswear studio athletic apparel"
 * loungewear -> "loungewear cozy clothing studio soft tones"
 * underwear -> "underwear minimal fashion studio isolated"
 * socks -> "socks pair apparel studio white background"
 * scarves -> "scarf accessory fashion studio isolated"
 * hats -> "hat cap fashion studio isolated background"
 * belts -> "belt leather accessory studio product photo"
 * bags -> "bag tote handbag studio product isolated"
 */